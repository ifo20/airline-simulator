import logging
from datetime import datetime
import json
import os
import pathlib

from flask import request, send_from_directory, Flask
from tinydb import Query, where

from airline import Airline
from airport import Airport, all_airports
from db import initialise
from plane import PlaneStore, Plane
from route import OfferedRoute, PurchasedRoute, RouteBase


logging.basicConfig(level=logging.INFO)


WEBSITE_ROOT = os.path.join(pathlib.Path(__file__).resolve().parent.parent, "website")

app = Flask(__name__, static_folder=WEBSITE_ROOT)

AIRLINES = {}
AIRPORTS = {a.code: a for a in all_airports()}
PLANE_STORE = PlaneStore()

airports_db, airlines_db, routes_db, planes_db = initialise()


class ComplexEncoder(json.JSONEncoder):
	def default(self, obj):
		# logging.info("default: %s", obj)
		if isinstance(obj, datetime):
			return obj.isoformat()
		if isinstance(obj, (Airport, Airline, RouteBase)):
			return obj.__dict__
		if isinstance(obj, Plane):
			d = obj.__dict__.copy()
			d.pop("route")
			d["status"] = obj.status
			return d
		return json.JSONEncoder.default(self, obj)


def jsonify(data):
	return ComplexEncoder().encode(data)


@app.errorhandler(Exception)
def handle_exception(e):
	if isinstance(e, AssertionError):
		return str(e), 400
	# below is for local use only
	return repr(e), 500


@app.route("/static/<path:filename>")
def serve_static(filename):
	return send_from_directory(WEBSITE_ROOT, filename)


@app.route("/debug")
def debug():
	return jsonify(AIRLINES)


@app.route("/")
def home():
	return send_from_directory(WEBSITE_ROOT, "index.html")


@app.route("/leaderboard")
def leaderboard():
	all_airlines = sorted(
		AIRLINES.values(), key=lambda airline: airline.cash, reverse=True
	)
	return "<br/>".join(
		f"{i}: {airline.name}: ${airline.cash}"
		for i, airline in enumerate(all_airlines, start=1)
	)


@app.route("/airports")
def list_airports():
	return jsonify(list(AIRPORTS.values()))


@app.route("/play", methods=["POST"])
def play():
	business_name = request.form["businessName"].strip()
	hub = request.form["hub"]
	if business_name in AIRLINES:
		airline = AIRLINES[business_name]
		airline.last_login = datetime.utcnow()
		airlines_db.update({"last_login": airline.last_login}, Query().name == airline.name)
	else:
		airline = Airline(business_name, AIRPORTS[hub])
		airlines_db.insert(airline.db_dict())
		AIRLINES[business_name] = airline

	return jsonify(airline)


@app.route("/routes", methods=["GET"])
def list_routes():
	airline = AIRLINES[request.args["businessName"]]
	existing_route_destinations = {r.destination.code for r in airline.routes}
	all_destinations = [
		airport
		for airport in AIRPORTS.values()
		if airport.code != airline.hub.code
		and airport.code not in existing_route_destinations
		and airport.distance_from(airline.hub) > 100
	]
	all_destinations.sort(key=lambda airport: airport.distance_from(airline.hub))
	return jsonify(
		[OfferedRoute(airline.hub, airport) for airport in all_destinations[:3]]
	)


@app.route("/route", methods=["POST"])
def purchase_route():
	try:
		airline = AIRLINES[request.form["businessName"]]
	except KeyError:
		logging.warning("Bad business name: %s", request.form)
		return "Airline not found", 400
	popularity = request.form["popularity"]
	purchase_cost = int(request.form["purchaseCost"])
	try:
		origin = AIRPORTS[request.form["origin"]]
		destination = AIRPORTS[request.form["destination"]]
	except KeyError:
		logging.warning("Bad airports: %s", request.form)
		return "Origin or destination not found", 400
	if airline.cash < purchase_cost:
		return "Cannot afford route", 400
	route = PurchasedRoute(origin, destination, popularity, purchase_cost)
	routes_db.insert(route.db_dict(airline))
	airline.routes.append(route)
	logging.info("Added route for %s: %s", airline.name, route)
	airline.cash -= purchase_cost
	airlines_db.update({"cash": airline.cash}, Query().name == airline.name)
	return jsonify(
		{
			"route": route,
			"cash": airline.cash,
			"msg": f"Purchased route {route.identifier} for ${purchase_cost}!",
			"transaction": f"Purchased route {route.identifier} for ${purchase_cost}!",
		}
	)


@app.route("/planes", methods=["GET"])
def list_planes():
	airline = request.args.get("businessName")
	if airline:
		return jsonify(AIRLINES[airline].planes)
	return jsonify(PLANE_STORE.list_for_sale())


@app.route("/plane", methods=["POST"])
def purchase_plane():
	airline = AIRLINES[request.form["businessName"]]
	plane = PLANE_STORE.purchase_plane(int(request.form["planeId"]), airline)
	airlines_db.update({"cash": airline.cash}, Query().name == airline.name)
	planes_db.insert(plane.db_dict(airline))
	return jsonify(
		{
			"plane": plane,
			"cash": airline.cash,
			"msg": f"Purchased {plane.name}!",
			"transaction": f"Purchased plane {plane.name} for ${plane.purchase_cost}",
		}
	)


@app.route("/plane/fix", methods=["POST"])
def fix_plane():
	fix_cost = 100000
	airline = AIRLINES[request.form["businessName"]]
	assert airline.cash >= fix_cost, f"Airline cannot afford to fix - requires ${fix_cost}"
	for plane in airline.planes:
		if plane.id == int(request.form["planeId"]):
			plane.health = 100
			plane.save(planes_db, airline)
			airline.cash -= fix_cost
			airline.save(airlines_db)
			return jsonify(
				{
					"planes": airline.planes,
					"cash": airline.cash,
					"msg": f"Plane {plane} fixed for $100,000!",
					"transaction": f"Fixed plane {plane} for $100,000",
				}
			)
	raise RuntimeError(f"Airline {airline} does not have plane {request.form['planeId']}")


@app.route("/plane/scrap", methods=["POST"])
def scrap_plane():
	scrap_value = 10000
	airline = AIRLINES[request.form["businessName"]]
	plane_id = int(request.form["planeId"])
	assert any(
		p.id == plane_id for p in airline.planes
	), f"Airline does not have that plane"
	airline.planes = [p for p in airline.planes if p.id != plane_id]
	airline.cash += scrap_value
	planes_db.remove(where("id") == plane_id)
	airline.save(airlines_db)
	return jsonify(
		{
			"planes": airline.planes,
			"cash": airline.cash,
			"msg": f"Plane {plane} sold to Mojave scrapyard for $10,000!",
			"transaction": f"Sold plane {plane} to scrapyard for $10,000",
		}
	)


@app.route("/run-route", methods=["POST"])
def run_route():
	airline = AIRLINES[request.form["businessName"]]
	for route in airline.routes:
		if (
			route.origin.code == request.form["origin"]
			and route.destination.code == request.form["destination"]
		):
			plane = route.run(airline)
			route.save(routes_db, airline)
			plane.save(planes_db, airline)
			airlines_db.insert(airline.db_dict())

			return jsonify(
				{
					"msg": f"Route {route.identifier} has taken off with {plane.name}",
					"last_run": route.last_run,
					"next_available": route.next_available,
					"planes": airline.planes,
				}
			)


@app.route("/collect", methods=["POST"])
def collect_route():
	airline = AIRLINES[request.form["businessName"]]
	logging.info(
		"Customer %s collecting route results: %s", airline, request.form["route"]
	)
	origin, destination = request.form["route"].split("-")
	for route in airline.routes:
		if route.origin.code == origin and route.destination.code == destination:
			msg, incident, plane = route.collect(airline)
			route.save(routes_db, airline)
			plane.save(planes_db, airline)
			airlines_db.insert(airline.db_dict())

			return jsonify(
				{
					"msg": msg,
					"cash": airline.cash,
					"popularity": airline.popularity,
					"incident": incident,
					"planes": airline.planes,
				}
			)
	raise RuntimeError(
		f"Airline does not have route {origin} <-> {destination}, does have {'...'.join(f'{r.origin.code}<->{r.destination.code}' for r in airline.routes)}"
	)


if __name__ == "__main__":
	for db_airport in airports_db:
		AIRPORTS[db_airport["code"]] = Airport.from_db(db_airport)
	for db_airline in airlines_db:
		db_airline["hub"] = AIRPORTS[db_airline["hub"]]
		AIRLINES[db_airline["name"]] = Airline.from_db(db_airline)
	for db_route in routes_db:
		origin = AIRPORTS[db_route["origin"]]
		destination = AIRPORTS[db_route["destination"]]
		route = PurchasedRoute(
			origin, destination, db_route["popularity"], db_route["purchase_cost"]
		)
		AIRLINES[db_route["airline"]].routes.append(route)
	for db_plane in planes_db:
		plane = Plane(
			db_plane["id"], db_plane["name"], db_plane["max_distance"], db_plane["purchase_cost"]
		)
		AIRLINES[db_plane["airline"]].planes.append(plane)

	logging.info("Loaded airlines: %s", [a.name for a in AIRLINES.values()])
	app.run()
