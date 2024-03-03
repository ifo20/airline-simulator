"""
This module saves game state to a Postgresql database
We use the psycopg2 library to 'talk' to Postgresql
"""
import logging
import os
from typing import Any, List
import timeit
from flask import request

import psycopg2
import psycopg2.extras

from app.airline import Airline
from app.airport import Airport
from app.route import Route
from app.plane import Plane


class PostgresqlDatabase:
	def __init__(self):
		logging.info("Using a postgresql database")
		self.__conn = None

	def conn(self):
		if self.__conn is None:
			self.__conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode="disable")
		return self.__conn

	def close(self):
		logging.debug("Closing DB connection %s", request)
		if self.__conn:
			self.__conn.commit()
			self.__conn.close()

	def execute(self, query: str, *args) -> None:
		logging.debug("executing %s with args %s", query, tuple(args))
		with self.conn().cursor() as cur:
			cur.execute(query, tuple(args))

	def fetch_one(self, query: str, *args) -> Any:
		logging.debug("fetch_one executing %s with args %s", query, tuple(args))
		with self.conn().cursor() as cur:
			cur.execute(query, tuple(args))
			result = cur.fetchone()
		return result

	def fetch_all(self, query: str, *args) -> List[Any]:
		logging.debug("fetch_all executing %s with args %s", query, tuple(args))
		with self.conn().cursor() as cur:
			cur.execute(query, tuple(args))
			result = cur.fetchall()
			logging.debug("fetch_all result %s", result)
		return result

	def migrate(self):
		with open("001_initial.sql", "r") as f:
			self.conn().cursor().execute(f.read())

	def get_airports(self) -> List[List[Any]]:
		return [
			Airport.from_db_row(db_row) for db_row in self.fetch_all("SELECT * FROM airports ORDER BY popularity DESC")
		]

	def get_airport_by_code(self, code: str) -> List[Any]:
		db_row = self.fetch_one("SELECT * FROM airports WHERE code=%s", code)
		return Airport.from_db_row(db_row) if db_row else db_row

	def get_airlines(self) -> List[List[Any]]:
		return [
			Airline.from_db_row(db_row) for db_row in self.fetch_all("SELECT * FROM airlines")
		]

	def get_airline_by_id(self, airline_id: int) -> List[Any]:
		db_row = self.fetch_one("SELECT * FROM airlines WHERE id=%s", airline_id)
		return Airline.from_db_row(db_row) if db_row else None

	def get_airline_by_name(self, name: str) -> List[Any]:
		db_row = self.fetch_one("SELECT * FROM airlines WHERE name=%s", name)
		return Airline.from_db_row(db_row) if db_row else None

	def create_airline(self, airline) -> List[Any]:
		logging.debug("Inserting airline %s ...", airline)
		[inserted_id] = self.fetch_one(
			"""
INSERT INTO airlines (name, hub, joined_at, last_login_at, cash, popularity, password)
VALUES (%s, %s, now(), now(), %s, %s, %s) RETURNING id
""",
			airline.name,
			airline.hub,
			airline.cash,
			airline.popularity,
			airline.password,
		)
		logging.debug("Inserted airline %s: %s", inserted_id, airline)
		return inserted_id

	def save_airline(self, airline):
		return self.execute(
			"UPDATE airlines SET name=%s, hub=%s, joined_at=%s, last_login_at=%s, cash=%s, popularity=%s, fuel_efficiency_level=%s WHERE id=%s",
			airline.name,
			airline.hub.code,
			airline.joined_at,
			airline.last_login_at,
			airline.cash,
			airline.popularity,
			airline.fuel_efficiency_level,
			airline.id,
		)

	def list_offered_routes(self, airline_id: int) -> List[Route]:
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NULL", airline_id,
		):
			routes.append(Route.from_db_row(self, row))
		return routes

	def list_owned_routes(self, airline_id: int) -> List[Route]:
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NOT NULL", airline_id,
		):
			routes.append(Route.from_db_row(self, row))
		return routes

	def get_route_by_id(self, route_id: int):
		base = self.fetch_one("SELECT * FROM routes WHERE id=%s", route_id)
		if base:
			base = Route.from_db_row(self, base)
		return base

	def create_route(self, route: Route):
		return self.fetch_one(
			"""
INSERT INTO routes (airline_id, origin, destination, cost, popularity)
VALUES (%s, %s, %s, %s, %s) RETURNING *""",
			route.airline_id,
			route.origin.code,
			route.destination.code,
			route.cost,
			route.popularity,
		)

	def save_route(self, route):
		return self.execute(
			"UPDATE routes SET purchased_at=%s, last_run_at=%s, last_resulted_at=%s, next_available_at=%s WHERE id=%s",
			route.purchased_at,
			route.last_run_at,
			route.last_resulted_at,
			route.next_available_at,
			route.id,
		)

	def list_offered_planes(self, airline_id: int):
		return [
			Plane.from_db_row(db_row)
			for db_row in self.fetch_all(
				"SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NULL", airline_id,
			)
		]

	def list_owned_planes(self, airline_id: int):
		return [
			Plane.from_db_row(db_row)
			for db_row in self.fetch_all(
				"SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NOT NULL", airline_id,
			)
		]

	def get_plane_by_id(self, plane_id: int):
		db_row = self.fetch_one("SELECT * FROM planes WHERE id=%s", plane_id)
		return Plane.from_db_row(db_row) if db_row else db_row

	def create_plane(self, plane):
		plane_id = self.fetch_one(
			"""
INSERT INTO planes (airline_id, name, max_distance, cost)
VALUES (%s, %s, %s, %s) RETURNING id""",
			plane.airline_id,
			plane.name,
			plane.max_distance,
			plane.cost,
		)
		return plane_id

	def save_plane(self, plane):
		return self.execute(
			"""
UPDATE planes
SET purchased_at=%s, health=%s, route_id=%s
WHERE id=%s""",
			plane.purchased_at,
			plane.health,
			plane.route.id if plane.route else None,
			plane.id,
		)

	def delete_plane(self, plane_id):
		return self.execute("DELETE FROM planes WHERE id=%s", plane_id)

	def save_flight(self, route_id, plane_id, departed_at, arrived_at, num_passengers, income, cost, plane_health_cost):
		return self.execute(
			"""
INSERT INTO flights (route_id, plane_id, departed_at, arrived_at, num_passengers, income, cost, plane_health_cost)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
			route_id, plane_id, departed_at, arrived_at, num_passengers, income, cost, plane_health_cost,
		)

	def get_transactions(self, airline_id):
		return self.fetch_all("SELECT * FROM transactions WHERE airline_id=%s ORDER BY ts ASC", airline_id)

	def save_transaction(self, airline, amount, description):
		return self.fetch_one(
			"INSERT INTO transactions (airline_id, starting_balance, amount, description) VALUES (%s, %s, %s, %s) RETURNING *",
			airline.id, airline.cash, amount, description,
		)
# Sometimes it is convenient to be able to inject a lot of airports into a database:
# DATABASE_URL="host=localhost user=postgres password=postgres sslmode=disable" PYTHONPATH=. python -c "from app.db.postgresql import inject_airports;inject_airports()"
def inject_airports(filename="data/airports_full.json"):
	import json
	with open(filename, 'r') as f:
		airports = json.load(f)
	rows = []
	for airport in airports:
		try:
			code, name, country, lat, lon, popularity = airport
		except: # this except will catch if we didn't provide enough values
			# currently we are not providing popularity in that big JSON
			code, name, country, lat, lon = airport
			popularity = 50.0

		rows.append(f"('{code}', '{name}', '{country}', {lat}, {lon}, {popularity})")

	# This is slightly risky. What might go wrong if we are not in control of the JSON file?
	sql = f"INSERT INTO airports (code, name, country, latitude, longitude, popularity) VALUES {','.join(rows)} ON CONFLICT DO NOTHING"
	db = PostgresqlDatabase()
	db.execute(sql)
	db.close()
