import logging
from datetime import datetime, timedelta
import json
import os
import pathlib
from typing import Dict
import timeit
import time

from flask import abort, request, send_from_directory, Flask
import pytz

from app.db import get_db
from app.airline import Airline
from app.airport import Airport
from app.config import NUM_OFFERS, PLANE_STARTING_HEALTH, pretty_price
from app.flight import Flight
from app.news import search_news
from app.plane import Plane
from app.route import Route
from app.transaction import Transaction


logging.basicConfig(level=logging.INFO)
WEBSITE_ROOT = os.path.join(pathlib.Path(__file__).resolve().parent.parent, "website")
app = Flask(__name__, static_folder=WEBSITE_ROOT)
DB = get_db()

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
		time.sleep(0.01)
		if isinstance(obj, datetime):
			return obj.isoformat()
		if isinstance(obj, (Airport, Airline, Route, Transaction, Flight)):
			return obj.__dict__
		if isinstance(obj, Plane):
			d = obj.__dict__.copy()
			d["status"] = obj.status
			d["requires_fix"] = obj.requires_fix
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

# This is an endpoint to show how many airlines are registered/currently online!
@app.route("/meta", methods=["GET"])
def meta():
	all_airlines = Airline.leaderboard(DB)
	num_online = 0
	time_now = datetime.now(pytz.UTC)
	for airline in all_airlines:
		# TODO justin: is this an accurate way of counting number of currently-online players?
		if time_now - airline.last_login_at <= timedelta(hours=2):
			num_online += 1
	return jsonify({
		"total": len(all_airlines),
		"online": num_online
	})

@app.route("/signup", methods=["POST"])
def signup():
	airline_name = airline_name_from_request(request)
	airline = Airline.create(DB, airline_name, request.form["hub"], request.form["password"])
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
	return response

@app.route("/login", methods=["POST"])
def login():
	airline_name = airline_name_from_request(request)
	airline = Airline.login(DB, airline_name, request.form["password"])
	j: Dict = json.loads(jsonify(airline))
	j["routes"] = Route.list_owned(DB, airline.id)
	j["planes"] = Plane.list_owned(DB, airline.id)
	j["transactions"] = Transaction.list(DB, airline.id)
	all_airlines = Airline.leaderboard(DB)
	n = len(all_airlines)
	for idx, leaderboard_airline in enumerate(all_airlines, start=1):
		if leaderboard_airline.id == airline.id:
			this_rank = idx
	j["rank"] = f"#{this_rank} / {n}"
	response = jsonify(j)
	return response

@app.route("/offered_routes", methods=["GET"])
def offered_routes():
	start_ts = timeit.default_timer()
	airline = airline_from_request(request)
	offered_routes = Route.list_offered(DB, airline.id)
	airports = DB.get_airports()
	if len(offered_routes) < NUM_OFFERS:
		Route.generate_offers(
			DB, airports, airline, NUM_OFFERS - len(offered_routes), offered_routes
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

#TODO: Justin - add more interesting things into here.
@app.route("/reputation/<int:airline_id>", methods=["GET"])
def airline_reputation(airline_id):
	time.sleep(0.2)
	airline = Airline.get_by_id(DB, airline_id)
	if airline:
		if airline.popularity > 89:
			airline_reputation = f"Customers favorite airline in {airline.hub.country}!"
			num_stars = 5
		elif airline.popularity > 69:
			airline_reputation = "Very reputable airline"
			num_stars = 4
		elif airline.popularity > 49:
			airline_reputation = "Distinctly average"
			num_stars = 3
		elif airline.popularity > 39:
			airline_reputation = "Poor airline Reputation"
			num_stars = 2
		else:
			airline_reputation = "Customers least favorite choice"
			num_stars = 1

		return jsonify({
			"airline_reputation":airline_reputation,
			"num_stars":num_stars
		})

@app.route("/purchase_route", methods=["POST"])
def purchase_route():
	airline = airline_from_request(request)
	route = Route.get_by_id(DB, int(request.form["route_id"]))
	if route.airline_id != airline.id:
		return "route belongs to different airline", 400
	if route.purchased_at is not None:
		return "that route is already purchased", 400
	if airline.cash < route.cost:
		return "Cannot afford route", 400
	description = f"Purchased route {route.identifier} for ${route.cost}!"
	transaction = Transaction.create(DB, airline, -route.cost, description)
	airline.cash -= route.cost
	DB.save_airline(airline)
	route.purchase(DB)
	return jsonify(
		{
			"route": route,
			"cash": airline.cash,
			"msg": description,
			"transaction": transaction,
		}
	)


@app.route("/offered_planes", methods=["GET"])
def offered_planes():
	airline_id = airline_id_from_request(request)
	planes_for_sale = Plane.list_offered(DB, airline_id)
	if len(planes_for_sale) < NUM_OFFERS:
		Plane.generate_offers(DB, airline_id, NUM_OFFERS - len(planes_for_sale))
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
	upgrade_cost = 10000
	if airline.cash < upgrade_cost:
		raise AssertionError("You do not have enough to cash to purchase this upgrade")
	if airline.fuel_efficiency_level >= 5:
		raise AssertionError("You already have the maximum level of fuel effiency!")
	description = f"Upgraded fuel efficiency from {airline.fuel_efficiency_level - 1} to {airline.fuel_efficiency_level} for {pretty_price(upgrade_cost)}"
	transaction = Transaction.create(DB, airline, -upgrade_cost, description)
	airline.cash -= upgrade_cost
	airline.fuel_efficiency_level += 1
	DB.save_airline(airline)
	return jsonify({
			"title": "Fuel Efficiency",
			"cash": airline.cash,
			"transaction": transaction,
			"current_level": airline.fuel_efficiency_level,
			"upgrade_cost": upgrade_cost,
			"upgrade_enabled": airline.fuel_efficiency_level < 5 and airline.cash > upgrade_cost,
		})

@app.route("/upgrades", methods=["GET"])
def get_upgraded():
	airline = airline_from_request(request)
	placeholder_upgrade = {
		"title": "Coming Soon!",
		"current_level": 0,
		"upgrade_cost": 0,
		"upgrade_enabled": False,
		"button_text": "TODO",
		"description": "TODO: describe the current level of the upgrade",
		"upgrade_description": "TODO: describe the next level of upgrade",
	}
	upgrade_cost = 10000
	if airline.fuel_efficiency_level >= 5:
		upgrade_enabled = False
		button_text = "Maxed out"
	else:
		upgrade_enabled = True
		button_text = f"Upgrade for {pretty_price(upgrade_cost)}"
	upgrades = [
		{
			"title": "Fuel Efficiency",
			"current_level": airline.fuel_efficiency_level,
			"upgrade_cost": upgrade_cost,
			"upgrade_enabled": upgrade_enabled,
			"button_text": button_text,
			"description": "TODO: describe the current level of the upgrade",
			"upgrade_description": "TODO: describe the next level of upgrade",
		}
	] + [placeholder_upgrade] * 2
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
	description = f"Purchased plane {plane.name} for ${plane.cost}"
	transaction = Transaction.create(DB, airline, -plane.cost, description)
	airline.cash -= plane.cost
	DB.save_airline(airline)
	plane.purchase(DB)
	return jsonify(
		{
			"plane": plane,
			"cash": airline.cash,
			"msg": f"Purchased {plane.name}!",
			"transaction": transaction,
		}
	)


@app.route("/plane/fix", methods=["POST"])
def fix_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, int(request.form["plane_id"]))
	assert airline.cash >= plane.fix_cost, f"Airline cannot afford to fix - requires ${pretty_price(plane.fix_cost)}"
	plane.health = PLANE_STARTING_HEALTH
	DB.save_plane(plane)
	description = f"Fixed {plane.name} for {pretty_price(plane.fix_cost)}"
	transaction = Transaction.create(DB, airline, -plane.fix_cost, description)
	airline.cash -= plane.fix_cost
	DB.save_airline(airline)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane.name} fixed for {pretty_price(plane.fix_cost)}!",
			"transaction": transaction,
		}
	)


@app.route("/plane/scrap", methods=["POST"])
def scrap_plane():
	airline = airline_from_request(request)
	plane = Plane.get_by_id(DB, int(request.form["plane_id"]))
	assert plane.airline_id == airline.id, f"Airline does not have that plane"
	description = f"Sold {plane.name} to scrapyard for {pretty_price(plane.scrap_value)}"
	transaction = Transaction.create(DB, airline, +plane.scrap_value, description)
	airline.cash += plane.scrap_value
	DB.save_airline(airline)
	DB.delete_plane(plane.id)
	planes = [p for p in Plane.list_owned(DB, airline.id) if p.id != plane.id]
	return jsonify(
		{
			"planes": planes,
			"cash": airline.cash,
			"msg": f"Plane {plane.name} sold to Mojave scrapyard for {pretty_price(plane.scrap_value)}!",
			"transaction": transaction,
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
	num_passengers, income, cost, popularity_change, plane_health_cost, incident, msg = route.collect(DB, airline)
	DB.save_route(route)
	cash_change = income - cost
	transaction = Transaction.create(DB, airline, +cash_change, msg)
	airline.cash += cash_change
	airline.popularity += popularity_change
	DB.save_airline(airline)
	for plane in Plane.list_owned(DB, airline.id):
		if plane.route_id == route.id:
			plane.health -= plane_health_cost
			plane.free()
			DB.save_plane(plane)
			DB.save_flight(route.id, plane.id, route.last_run_at, route.next_available_at, num_passengers, income, cost, plane_health_cost)
	planes = Plane.list_owned(DB, airline.id)
	return jsonify(
		{
			"msg": msg,
			"cash": airline.cash,
			"popularity": airline.popularity,
			"incident": incident,
			"transaction": transaction,
			"planes": planes,
			"status": "ready",
		}
	)

@app.route("/news", methods=["GET"])
def news():
	return jsonify(search_news("airline simulator planes")[:10])


if __name__ == "__main__":
	DB.migrate()
	app.run(debug=True, host="0.0.0.0", port=os.environ.get("PORT", 8000))
