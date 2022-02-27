from datetime import datetime
import logging
import os
from typing import Any, List
import timeit

import psycopg2
import psycopg2.extras


class DatabaseInterface:
	def open(self):
		start_ts = timeit.default_timer()
		self.conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode="require")
		logging.info("TIMER DB connection took %s", timeit.default_timer() - start_ts)

	def close(self):
		logging.info("Closing DB connection")
		self.conn.commit()
		self.conn.close()

	def execute(self, query: str, *args) -> None:
		logging.info("executing %s with args %s", query, tuple(args))
		with self.conn.cursor() as cur:
			cur.execute(query, tuple(args))

	def fetch_one(self, query: str, *args) -> Any:
		logging.info("fetch_one executing %s with args %s", query, tuple(args))
		with self.conn.cursor() as cur:
			cur.execute(query, tuple(args))
			result = cur.fetchone()
		return result

	def fetch_all(self, query: str, *args) -> List[Any]:
		logging.info("fetch_all executing %s with args %s", query, tuple(args))
		with self.conn.cursor() as cur:
			cur.execute(query, tuple(args))
			result = cur.fetchall()
		return result

	def migrate(self):
		with open("001_initial.sql", "r") as f:
			self.conn.cursor().execute(f.read())

	def get_airports(self) -> List[List[Any]]:
		return self.fetch_all("SELECT * FROM airports")

	def get_airport_by_code(self, code: str) -> List[Any]:
		return self.fetch_one("SELECT * FROM airports WHERE code=%s", code)

	def get_airlines(self) -> List[List[Any]]:
		return self.fetch_all("SELECT * FROM airlines")

	def get_airline_by_id(self, airline_id: int) -> List[Any]:
		return self.fetch_one("SELECT * FROM airlines WHERE id=%s", airline_id)

	def get_airline_by_name(self, name: str) -> List[Any]:
		return self.fetch_one("SELECT * FROM airlines WHERE name=%s", name)

	def create_airline(
		self, name: str, hub_code: str, starting_cash: int, starting_popularity: int
	) -> List[Any]:
		logging.info("Inserting airline %s ...", name)
		[inserted_id] = self.fetch_one(
			"""
INSERT INTO airlines (name, hub, joined_at, last_login_at, cash, popularity)
VALUES (%s, %s, now(), now(), %s, %s) RETURNING id
""",
			name,
			hub_code,
			starting_cash,
			starting_popularity,
		)
		logging.info("Inserted airline %s: %s", inserted_id, name)
		return self.get_airline_by_id(inserted_id)

	def update_last_login_at(self, airline_id: int):
		return self.execute("UPDATE airlines SET last_login_at=now() WHERE id=%s", airline_id)

	def update_airline(self, airline):
		return self.execute(
			"UPDATE airlines SET cash=%s, popularity=%s WHERE id=%s",
			airline.cash,
			airline.popularity,
			airline.id,
		)

	def update_airline_cash(self, airline_id: int, cash: int):
		return self.execute("UPDATE airlines SET cash=%s WHERE id=%s", cash, airline_id)

	def list_offered_routes(self, airline_id: int):
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NULL", airline_id
		):
			routes.append(row)
		return routes

	def list_owned_routes(self, airline_id: int) -> List[List[Any]]:
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NOT NULL", airline_id
		):
			routes.append(row)
		return routes

	def get_route_by_id(self, route_id: int):
		return self.fetch_one("SELECT * FROM routes WHERE id=%s", route_id)

	def create_route(
		self, airline_id: int, origin: str, destination: str, popularity: int, cost: int
	):
		return self.fetch_one(
			"""
INSERT INTO routes (airline_id, origin, destination, popularity, cost)
VALUES (%s, %s, %s, %s, %s) RETURNING *""",
			airline_id,
			origin,
			destination,
			popularity,
			cost,
		)

	def update_route_for_purchase(
		self, route_id: int, purchased_at: datetime, next_available_at: datetime
	):
		return self.execute(
			"UPDATE routes SET purchased_at=%s, next_available_at=%s WHERE id=%s",
			purchased_at,
			next_available_at,
			route_id,
		)

	def update_route_for_run(self, route):
		return self.execute(
			"UPDATE routes SET next_available_at=%s, last_run_at=%s, last_resulted_at=%s WHERE id=%s",
			route.next_available_at,
			route.last_run_at,
			route.last_resulted_at,
			route.id,
		)

	def list_offered_planes(self, airline_id: int):
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NULL", airline_id
		):
			routes.append(row)
		return routes

	def list_owned_planes(self, airline_id: int):
		routes = []
		for row in self.fetch_all(
			"SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NOT NULL", airline_id
		):
			routes.append(row)
		return routes

	def get_plane_by_id(self, plane_id: int):
		return self.fetch_one("SELECT * FROM planes WHERE id=%s", plane_id)

	def create_plane(self, airline_id: int, name: str, max_distance: int, cost: int):
		return self.fetch_one(
			"""
INSERT INTO planes (airline_id, name, max_distance, cost)
VALUES (%s, %s, %s, %s) RETURNING *""",
			airline_id,
			name,
			max_distance,
			cost,
		)

	def update_plane(self, plane):
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
