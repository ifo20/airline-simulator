import logging
from datetime import datetime
import json
import os
import pathlib
from typing import Dict
import timeit

from flask import abort, request, send_from_directory, Flask

from app.db import get_db
from app.airline import Airline
from app.airport import Airport
from app.config import PLANE_FIX_COST, PLANE_SCRAP_VALUE, pretty_price
from app.plane import Plane
from app.route import Route


logging.basicConfig(level=logging.INFO)

WEBSITE_ROOT = os.path.join(pathlib.Path(__file__).resolve().parent.parent, "website")
app = Flask(__name__, static_folder=WEBSITE_ROOT)

logging.debug("Created app, WEBSITE_ROOT=%s", WEBSITE_ROOT)

MINIMUM_OFFERS = 3

DB = get_db()


@app.before_request
def before_request_func():
	DB.open()


@app.teardown_request
def teardown_request_func(error=None):
	try:
		DB.close()
	except:
		pass


def airline_id_from_request(request):
	try:
		return int(request.form["airline_id"])
	except KeyError:
		return int(request.args["airline_id"])


def airline_name_from_request(request):
	try:
		return request.form["businessName"].strip()
	except KeyError:
		return request.args["businessName"].strip()


def airline_from_request(request):
	airline = Airline.get_by_id(DB, airline_id_from_request(request))
	if not airline:
		print(f"Failed to get airline from request: {request}")
		abort(404)
	return airline


class ComplexEncoder(json.JSONEncoder):
	def default(self, obj):
		logging.debug("default: %s", obj)
		if isinstance(obj, datetime):
			return obj.isoformat()
		if isinstance(obj, (Airport, Airline, Route)):
			return obj.__dict__
		if isinstance(obj, Plane):
			d = obj.__dict__.copy()
			d["status"] = obj.status
			return d
		return json.JSONEncoder.default(self, obj)


def jsonify(data):
	return ComplexEncoder().encode(data)


@app.errorhandler(Exception)
def handle_exception(e):
	logging.exception("Error handler called with %s", e)
	if isinstance(e, AssertionError):
		return str(e), 400
	# below is for local use only
	return repr(e), 500


@app.route("/static/<path:filename>")
def serve_static(filename):
	logging.info("serve_static filename=%s ROOT=%s", filename, WEBSITE_ROOT)
	return send_from_directory(WEBSITE_ROOT, filename)


@app.route("/favicon.ico")
def fav():
	return send_from_directory(WEBSITE_ROOT, "favicon.ico")


@app.route("/debug")
def debug():
	return jsonify(None)


@app.route("/")
def home():
	return send_from_directory(WEBSITE_ROOT, "index.html")


@app.route("/leaderboard")
def leaderboard():
	all_airlines = Airline.leaderboard(DB)
	rows = "".join(
		[
			f"<tr><td>{i}</td><td>{airline.name}</td><td>{airline.joined_at.date()}</td><td>${airline.cash}</td><td>{airline.popularity:.0f}</td><td>{airline.fuel_efficiency_level}</td></tr>"
			for i, airline in enumerate(all_airlines, start=1)
		]
	)
	return f"""
<link rel="stylesheet" href="static/index.css">
<table>
<thead><tr><th>Rank</th><th>Airline</th><th>Date Joined</th><th>Cash</th><th>Reputation</th><th>Fuel Efficiency</th></tr></thead>
<tbody>{rows}</tbody>
</table>"""


@app.route("/airports")
def list_airports():
	# It's a bit slow to load all of them. Let's take the first 300?
	airports = DB.get_airports()
	return jsonify(airports[:300])


@app.route("/play", methods=["POST"])
def play():
	start_ts = timeit.default_timer()
	airline_name = airline_name_from_request(request)
	airline = Airline.login(DB, airline_name, request.form["hub"])
	j: Dict = json.loads(jsonify(airline))
	j["routes"] = Route.list_owned(DB, airline.id)
	j["planes"] = Plane.list_owned(DB, airline.id)
	all_airlines = Airline.leaderboard(DB)
	n = len(all_airlines)
	for idx, leaderboard_airline in enumerate(all_airlines, start=1):
		if leaderboard_airline.id == airline.id:
			this_rank = idx
	j["rank"] = f"#{this_rank} / {n}"
	response = jsonify(j)
	logging.debug("TIMER play took %s", timeit.default_timer() - start_ts)
	return response


@app.route("/offered_routes", methods=["GET"])
def offered_routes():
	start_ts = timeit.default_timer()
	airline = airline_from_request(request)
	offered_routes = Route.list_offered(DB, airline.id)
	airports = DB.get_airports()
	if len(offered_routes) < MINIMUM_OFFERS:
		Route.generate_offers(
			DB, airports, airline, MINIMUM_OFFERS - len(offered_routes), offered_routes
		)
		offered_routes = Route.list_offered(DB, airline.id)
	logging.debug(
		"TIMER offered_routes took %s for Airline %r",
		timeit.default_timer() - start_ts,
		airline.id,
	)
	logging.debug("offered_routes response:%s", offered_routes)
	return jsonify(offered_routes)


@app.route("/owned_routes", methods=["GET"])
def owned_routes():
	start_ts = timeit.default_timer()
	airline_id = airline_id_from_request(request)
	owned_routes = Route.list_owned(DB, airline_id)
	logging.debug("TIMER owned_routes took %s", timeit.default_timer() - start_ts)
	logging.debug("owned_routes response:%s", owned_routes)
	return jsonify(owned_routes)


@app.route("/route/<int:route_id>", methods=["GET"])
def get_route(route_id):
	route = Route.get_by_id(DB, route_id)
	if route:
		route.update_status()
	return jsonify(route)


@app.route("/purchase_route", methods=["POST"])
def purchase_route():
	start_ts = timeit.default_timer()
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, int(request.form["route_id"]))
	if route.airline_id != airline.id:
		return "route belongs to different airline", 400
	if route.purchased_at is not None:
		return "that route is already purchased", 400
	if airline.cash < route.cost:
		return "Cannot afford route", 400
	airline.cash -= route.cost
	DB.save_airline(airline)
	route.purchase(DB)
	logging.debug("TIMER purchase_route took %s", timeit.default_timer() - start_ts)
	return jsonify(
		{
			"route": route,
			"cash": airline.cash,
			"msg": f"Purchased route {route.identifier} for ${route.cost}!",
			"transaction": f"Purchased route {route.identifier} for ${route.cost}!",
		}
	)


@app.route("/offered_planes", methods=["GET"])
def offered_planes():
	airline_id = airline_id_from_request(request)
	planes_for_sale = Plane.list_offered(DB, airline_id)
	if len(planes_for_sale) < MINIMUM_OFFERS:
		Plane.generate_offers(DB, airline_id, MINIMUM_OFFERS - len(planes_for_sale))
		planes_for_sale = Plane.list_offered(DB, airline_id)
	logging.debug("offered_planes response:%s", planes_for_sale)
	return jsonify(planes_for_sale)


@app.route("/owned_planes", methods=["GET"])
def owned_planes():
	planes = Plane.list_owned(DB, airline_id_from_request(request))
	logging.debug("owned_planes response:%s", planes)
	return jsonify(planes)

@app.route("/upgrade_fuel_efficiency", methods=["POST"])
def upgrade_fuel_efficiency():
	airline = airline_from_request(request)
	airline.fuel_efficiency_level += 1 
	DB.save_airline(airline)
	return jsonify({
			"title": "Fuel Efficiency",
			"current_level": airline.fuel_efficiency_level,
			"upgrade_cost": 10000,
			"upgrade_enabled": airline.cash > 10000,
		})
	
@app.route("/upgrades", methods=["GET"])
def get_upgraded():
	airline = airline_from_request(request)
	placeholder_upgrade = {
		"title": "Coming Soon!",
		"current_level": 0,
		"upgrade_cost": 0,
		"upgrade_enabled": False,
	}
	upgrades = [
		{
			"title": "Fuel Efficiency",
			"current_level": airline.fuel_efficiency_level,
			"upgrade_cost": 10000,
			"upgrade_enabled": airline.cash > 10000,
		}
	] + [placeholder_upgrade] * 8
	return jsonify(upgrades)

@app.route("/purchase_plane", methods=["POST"])
def purchase_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, int(request.form["plane_id"]))
	logging.info("Purchasing plane: %s for airline %s", plane, airline.id)
	if plane.airline_id != airline.id:
		return "plane belongs to different airline", 400
	if plane.purchased_at is not None:
		return "that plane is already purchased", 400
	if airline.cash < plane.cost:
		return "you cannot afford that plane", 400
	airline.cash -= plane.cost
	DB.save_airline(airline)
	plane.purchase(DB)
	return jsonify(
		{
			"plane": plane,
			"cash": airline.cash,
			"msg": f"Purchased {plane.name}!",
			"transaction": f"Purchased plane {plane.name} for ${plane.cost}",
		}
	)


@app.route("/plane/fix", methods=["POST"])
def fix_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, int(request.form["plane_id"]))
	assert airline.cash >= PLANE_FIX_COST, f"Airline cannot afford to fix - requires ${pretty_price(PLANE_FIX_COST)}"
	plane.health = 100
	DB.save_plane(plane)
	airline.cash -= PLANE_FIX_COST
	DB.save_airline(airline)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane.name} fixed for {pretty_price(PLANE_FIX_COST)}!",
			"transaction": f"Fixed {plane.name} for {pretty_price(PLANE_FIX_COST)}",
		}
	)


@app.route("/plane/scrap", methods=["POST"])
def scrap_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, int(request.form["plane_id"]))
	assert plane.airline_id == airline.id, f"Airline does not have that plane"
	airline.cash += PLANE_SCRAP_VALUE
	DB.save_airline(airline)
	DB.delete_plane(plane.id)
	planes = [p for p in Plane.list_owned(DB, airline.id) if p.id != plane.id]
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane.name} sold to Mojave scrapyard for {pretty_price(PLANE_SCRAP_VALUE)}!",
			"transaction": f"Sold {plane.name} to scrapyard for {pretty_price(PLANE_SCRAP_VALUE)}",
		}
	)


@app.route("/fly_route", methods=["POST"])
def run_route():
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, request.form["route_id"])
	route.validate_can_run()
	plane = Plane.get_for_route(DB, route)

	route.run(airline)
	DB.save_route(route)
	plane.reserve(DB, route.id)
	DB.save_plane(plane)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"status": "flying",
			"msg": f"Route {route.identifier} has taken off with {plane.name}",
			"last_run_at": route.last_run_at,
			"next_available_at": route.next_available_at,
			"planes": planes,
		}
	)


@app.route("/collect", methods=["POST"])
def collect_route():
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, request.form["route_id"])
	cash_change, popularity_change, plane_health_cost, incident, msg = route.collect(
		airline
	)
	DB.save_route(route)
	airline.cash += cash_change
	airline.popularity += popularity_change
	DB.save_airline(airline)
	for plane in Plane.list_owned(DB, airline.id):
		if plane.route_id == route.id:
			plane.health -= plane_health_cost
			plane.free()
			DB.save_plane(plane)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"msg": msg,
			"cash": airline.cash,
			"popularity": airline.popularity,
			"incident": incident,
			"planes": planes,
			"status": "ready",
		}
	)


if __name__ == "__main__":
	DB.migrate()
	app.run(debug=True, host="0.0.0.0", port=os.environ.get("PORT", 8000))
