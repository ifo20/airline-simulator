from ctypes import Union
from datetime import datetime
import random
from typing import List

import pytz

from app.db import DatabaseInterface
from app.route import Route

STARTING_HEALTH = 100
REQUIRED_FLYING_HEALTH = 30


def generate_name():
	return random.choice(
		[
			"Boeing 737-800",
			"Boeing 737-900",
			"Boeing 737 Max 9",
			"Boeing 747",
			"Boeing 757",
			"Boeing 767",
			"Boeing 777",
			"Boeing 777-200",
			"Boeing 777X",
			"Boeing 777-300",
			"Boeing 787 Dreamliner",
			"Airbus A320",
			"Airbus A330",
			"Airbus A350",
			"Airbus A360",
		]
	)


class Plane:
	def __init__(
		self,
		plane_id,
		airline_id,
		name,
		max_distance,
		cost,
		offered_at,
		purchased_at,
		health,
		route,
	):
		self.id = plane_id
		self.airline_id = airline_id
		self.name = name
		self.max_distance = max_distance
		self.cost = cost
		self.offered_at = offered_at
		self.purchased_at = purchased_at
		self.health = health
		self.route: Union[Route, None] = route

	@staticmethod
	def from_db_row(db: DatabaseInterface, db_row):
		(
			plane_id,
			airline_id,
			name,
			max_distance,
			cost,
			offered_at,
			purchased_at,
			health,
			route_id,
		) = db_row
		if route_id is None:
			route = None
		else:
			route = Route.get_by_id(db, route_id)
		return Plane(
			plane_id,
			airline_id,
			name,
			max_distance,
			cost,
			offered_at,
			purchased_at,
			health,
			route,
		)

	@staticmethod
	def list_offered(db: DatabaseInterface, airline_id: int) -> List[object]:
		return [
			Plane.from_db_row(db, db_row) for db_row in db.list_offered_planes(airline_id)
		]

	@staticmethod
	def list_owned(db: DatabaseInterface, airline_id: int) -> List[object]:
		return [Plane.from_db_row(db, db_row) for db_row in db.list_owned_planes(airline_id)]

	@staticmethod
	def generate_offers(db: DatabaseInterface, airline_id: int, num_offers: int):
		min_cost = 100000
		min_distance = 500
		max_distance = 16000
		for _ in range(num_offers):
			distance = random.randint(min_distance, max_distance)
			cost = min_cost + distance * 20
			db.create_plane(airline_id, generate_name(), distance, cost)

	@staticmethod
	def get_by_id(db: DatabaseInterface, plane_id: int):
		return Plane.from_db_row(db, db.get_plane_by_id(plane_id))

	@staticmethod
	def get_for_route(db: DatabaseInterface, route: Route):
		for plane in Plane.list_owned(db, route.airline_id):
			if plane.route is not None:
				continue  # can't use, in the sky
			if plane.health < REQUIRED_FLYING_HEALTH:
				continue  # can't use, in bad shape
			if plane.max_distance < route.distance:
				continue  # can't use, not good enough
			# if we reach here, we can use this plane
			return plane
		raise AssertionError("No planes are available to run this route!")

	@staticmethod
	def scrap(db: DatabaseInterface, plane):
		db.delete_plane(plane.id)

	@property
	def status(self):
		if self.purchased_at is None:
			return "Available for purchase"
		if self.route:
			return f"Flying {self.route.origin.code} <-> {self.route.destination.code}"
		if self.health < REQUIRED_FLYING_HEALTH:
			return "Requires maintenance"
		return "Available"

	def purchase(self, db: DatabaseInterface):
		now_ts = datetime.now(pytz.UTC)
		self.purchased_at = now_ts
		self.health = STARTING_HEALTH
		db.update_plane(self)

	def available_for_route(self, route):
		return self.route is None and self.max_distance > route.distance

	def reserve(self, db: DatabaseInterface, route: Route):
		self.route = route
		db.update_plane(self)

	def free(self, db: DatabaseInterface):
		self.route = None
		db.update_plane(self)
