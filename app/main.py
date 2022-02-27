import logging
from datetime import datetime
import json
import os
import pathlib
from typing import Dict
import timeit

from flask import request, send_from_directory, Flask

from app.db import DatabaseInterface
from app.airline import Airline
from app.airport import Airport
from app.plane import Plane
from app.route import Route


logging.basicConfig(level=logging.INFO)

WEBSITE_ROOT = os.path.join(pathlib.Path(__file__).resolve().parent.parent, "website")
app = Flask(__name__, static_folder=WEBSITE_ROOT)

logging.info("Created app, WEBSITE_ROOT=%s", WEBSITE_ROOT)

MINIMUM_OFFERS = 3

DB = DatabaseInterface()


@app.before_request
def before_request_func():
	DB.open()


@app.teardown_request
def teardown_request_func(error=None):
	DB.close()


def airline_id_from_request(request):
	try:
		return request.form["airlineId"]
	except KeyError:
		return request.args["airlineId"]


def airline_name_from_request(request):
	try:
		return request.form["businessName"].strip()
	except KeyError:
		return request.args["businessName"].strip()


def airline_from_request(request):
	return Airline.get_by_id(DB, airline_id_from_request(request))


class ComplexEncoder(json.JSONEncoder):
	def default(self, obj):
		# logging.info("default: %s", obj)
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
	return jsonify(Airline.list(DB))


@app.route("/")
def home():
	return send_from_directory(WEBSITE_ROOT, "index.html")


@app.route("/leaderboard")
def leaderboard():
	all_airlines = sorted(Airline.list(DB), key=lambda airline: airline.cash, reverse=True)
	return "<br/>".join(
		f"{i}: {airline.name}: ${airline.cash}"
		for i, airline in enumerate(all_airlines, start=1)
	)


@app.route("/airports")
def list_airports():
	return jsonify(list(Airport.list(DB)))


@app.route("/play", methods=["POST"])
def play():
	start_ts = timeit.default_timer()
	airline_name = airline_name_from_request(request)
	airline = Airline.login(DB, airline_name, request.form["hub"])
	j: Dict = json.loads(jsonify(airline))
	j["routes"] = Route.list_owned(DB, airline.id)
	j["planes"] = Plane.list_owned(DB, airline.id)
	response = jsonify(j)
	logging.info("TIMER play took %s", timeit.default_timer() - start_ts)
	return response


@app.route("/offered_routes", methods=["GET"])
def offered_routes():
	start_ts = timeit.default_timer()
	airline = airline_from_request(request)
	offered_routes = Route.list_offered(DB, airline.id)
	if len(offered_routes) < MINIMUM_OFFERS:
		Route.generate_offers(
			DB, airline, MINIMUM_OFFERS - len(offered_routes), offered_routes
		)
		offered_routes = Route.list_offered(DB, airline.id)
	logging.info("TIMER offered_routes took %s", timeit.default_timer() - start_ts)
	return jsonify(offered_routes)


@app.route("/owned_routes", methods=["GET"])
def owned_routes():
	start_ts = timeit.default_timer()
	airline_id = airline_id_from_request(request)
	offered_routes = Route.list(DB, airline_id)
	logging.info("TIMER owned_routes took %s", timeit.default_timer() - start_ts)
	return jsonify(offered_routes)


@app.route("/purchase_route", methods=["POST"])
def purchase_route():
	start_ts = timeit.default_timer()
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, request.form["routeId"])
	if route.airline_id != airline.id:
		return "plane belongs to different airline", 400
	if route.purchased_at is not None:
		return "that plane is already purchased", 400
	if airline.cash < route.cost:
		return "you cannot afford that plane", 400
	if airline.cash < route.cost:
		return "Cannot afford route", 400
	airline.cash -= route.cost
	Airline.update_cash(DB, airline.id, airline.cash)
	route.purchase(DB)
	logging.info("TIMER purchase_route took %s", timeit.default_timer() - start_ts)
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
	return jsonify(planes_for_sale)


@app.route("/owned_planes", methods=["GET"])
def owned_planes():
	return jsonify(Plane.list_for_airline(DB, airline_id_from_request(request),))


@app.route("/purchase_plane", methods=["POST"])
def purchase_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, request.form["planeId"])
	if plane.airline_id != airline.id:
		return "plane belongs to different airline", 400
	if plane.purchased_at is not None:
		return "that plane is already purchased", 400
	if airline.cash < plane.cost:
		return "you cannot afford that plane", 400
	airline.cash -= plane.cost
	Airline.update_cash(DB, airline.id, airline.cash)
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
	fix_cost = 100000
	airline = airline_from_request(request)
	plane = Plane.get_by_id(request.form["planeId"])
	assert airline.cash >= fix_cost, f"Airline cannot afford to fix - requires ${fix_cost}"
	plane.health = 100
	# TODO update DB for new health
	airline.cash -= fix_cost
	Airline.update_cash(DB, airline.id, airline.cash)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane} fixed for $100,000!",
			"transaction": f"Fixed plane {plane} for $100,000",
		}
	)


@app.route("/plane/scrap", methods=["POST"])
def scrap_plane():
	scrap_value = 10000
	airline = airline_from_request(request)
	plane = Plane.get_by_id(request.form["planeId"])
	assert plane.airline_id == airline.id, f"Airline does not have that plane"
	airline.cash += scrap_value
	Airline.update_cash(DB, airline.id, airline.cash)
	# TODO actually scrap the plane
	planes = [p for p in Plane.list_owned(DB, airline.id) if p.id != plane.id]
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane} sold to Mojave scrapyard for $10,000!",
			"transaction": f"Sold plane {plane} to scrapyard for $10,000",
		}
	)


@app.route("/run-route", methods=["POST"])
def run_route():
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, request.form["routeId"])
	route.validate_can_run()
	plane = Plane.get_for_route(DB, route)
	route.run(DB)
	plane.reserve(DB, route)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"msg": f"Route {route.identifier} has taken off with {plane.name}",
			"last_run_at": route.last_run_at,
			"next_available_at": route.next_available_at,
			"planes": planes,
		}
	)


@app.route("/collect", methods=["POST"])
def collect_route():
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, request.form["routeId"])
	cash_change, popularity_change, plane_health_cost, incident, msg = route.collect(DB)
	DB.update_route_for_run(route)
	airline.cash += cash_change
	airline.popularity += popularity_change
	airline.update_for_route_collection(DB)
	for plane in Plane.list_owned(DB, airline.id):
		if plane.route and plane.route.id == route.id:
			plane.health -= plane_health_cost
			plane.free(DB)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"msg": msg,
			"cash": airline.cash,
			"popularity": airline.popularity,
			"incident": incident,
			"planes": planes,
		}
	)


if __name__ == "__main__":
	db = DatabaseInterface()
	db.migrate()
	app.run(debug=True, host="0.0.0.0", port=os.environ["PORT"])
