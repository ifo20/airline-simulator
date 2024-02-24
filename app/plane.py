from ctypes import Union
from datetime import datetime
import logging
import random
from typing import List

import pytz
from app.config import PLANE_COST, PLANE_MINIMUM_FLYING_HEALTH, PLANE_RANGE, PLANE_STARTING_HEALTH
from app.route import Route



def ensure_loaded(planes, db):
	if isinstance(planes, Plane):
		planes.load_route(db)
	else:
		for plane in planes:
			plane.load_route(db)
	return planes


def generate_name():
	return random.choice(
		[
			"Boeing 737-800NG (Next Generation)",
   			"Boeing 737-900NG (Next Generation)",
      		"Boeing 737-900ER (Extended Range)",
        
        	"Boeing 737 MAX 7",
         	"Boeing 737 MAX 8",
			"Boeing 737 MAX 9",
   			"Boeing 737 MAX 10",
      
			"Boeing 747-400",
   			"Boeing 747-400ER (Extended Range)",

			"Boeing 757-200"
   			"Boeing 757-300"
			"Boeing 757-200ER (Extended Range)",
    
			"Boeing 767-200",
   			"Boeing 767-300",
      		"Boeing 767-400",
        	"Boeing 767-200ER (Extended Range)",
   			"Boeing 767-300ER (Extended Range)",
   			"Boeing 767-400ER (Extended Range)",
   
			"Boeing 777",
			"Boeing 777-200",
			"Boeing 777-200",
   			"Boeing 777-300",
   			"Boeing 777-300ER (Extended Range)",
			"Boeing 777-200ER (Extended Range)",
			"Boeing 777-200LR (Long Range)",
			
   			"Boeing 777X",
   			"Boeing 777-8X",
			"Boeing 777-9X",
   			"Boeing 777-10X",
			
			"Boeing 787-8 Dreamliner",
			"Boeing 787-9 Dreamliner",
			"Boeing 787-10 Dreamliner",

			#TBD: ADD AIRBUS, ATR AND EMBRAER AIRCRAFT
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
		route_id,
	):
		self.id = plane_id
		self.airline_id = airline_id
		self.name = name
		self.max_distance = max_distance
		self.cost = cost
		self.offered_at = offered_at
		self.purchased_at = purchased_at
		self.health = health
		# A plane may be linked to a route i.e. it is currently flying that route
		# A route_id is enough to identify whether or not it is flying
		self.route_id: Union[int, None] = route_id
		# Sometimes we want access to the full Route object
		# This should always correspond the Route with id=self.route_id
		self.route: Union[Route, None] = None

	def __str__(self):
		return f"<Plane {self.id} belonging to airline {self.airline_id} />"

	@classmethod
	def from_db_row(cls, db_row):
		return cls(*db_row)

	@staticmethod
	def list_offered(db, airline_id: int) -> List[object]:
		return ensure_loaded(db.list_offered_planes(airline_id), db)

	@staticmethod
	def list_owned(db, airline_id: int) -> List[object]:
		return ensure_loaded(db.list_owned_planes(airline_id), db)

	@staticmethod
	def generate_offers(db, airline_id: int, num_offers: int):
		now_ts = datetime.now()
		for _ in range(num_offers):
			distance = random.randint(PLANE_RANGE["min"], PLANE_RANGE["max"])
			cost = PLANE_COST["min"] + distance * random.randint(15, 25)
			plane = Plane(
				None,
				airline_id,
				generate_name(),
				distance,
				cost,
				now_ts,
				None,
				PLANE_STARTING_HEALTH,
				None,
			)
			plane.id = db.create_plane(plane)

	def load_route(self, db):
		if self.route_id is not None:
			self.route = db.get_route_by_id(self.route_id)

	@staticmethod
	def get_by_id(db, plane_id: int):
		plane = db.get_plane_by_id(plane_id)
		return plane

	@staticmethod
	def get_for_route(db, route: Route):
		for plane in Plane.list_owned(db, route.airline_id):
			if plane.route_id is not None:
				continue  # can't use, in the sky
			if plane.health < PLANE_MINIMUM_FLYING_HEALTH:
				continue  # can't use, in bad shape
			if plane.max_distance < route.distance:
				continue  # can't use, not good enough
			# if we reach here, we can use this plane
			return plane
		raise AssertionError("No planes are available to run this route!")

	@property
	def status(self):
		if self.purchased_at is None:
			return "Available for purchase"
		if self.route_id:
			if self.route:
				return f"Flying {self.route.origin.code} <-> {self.route.destination.code}"
			else:
				raise RuntimeError("Plane's route was not loaded")
		if self.health < PLANE_MINIMUM_FLYING_HEALTH:
			return "Requires maintenance"
		return "Available"

	def purchase(self, db):
		now_ts = datetime.now(pytz.UTC)
		self.purchased_at = now_ts
		self.health = PLANE_STARTING_HEALTH
		db.save_plane(self)
		logging.debug("Purchased plane %s", self.id)

	def available_for_route(self, route):
		return self.route is None and self.max_distance > route.distance

	def reserve(self, db, route_id: int):
		self.route_id = route_id
		self.load_route(db)
		logging.debug("Reserved plane %s for route %s", self.id, route_id)

	def free(self):
		self.route_id = None
		self.route = None
		logging.debug("Freed plane %s", self.id)
