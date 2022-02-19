from datetime import datetime, timedelta
import logging
import math
import random
from typing import Any, List

from app.airline import Airline
from app.airport import Airport
from app.db import DatabaseInterface

LOGGER = logging.getLogger(__name__)


class Route:
	def __init__(
		self,
		id: int,
		airline_id: int,
		origin: Airport,
		destination: Airport,
		cost: int,
		popularity: int,
		offered_at: datetime,
		purchased_at: datetime,
		next_available_at: datetime,
		last_run_at: datetime,
		last_resulted_at: datetime,
	) -> None:
		self.id = id
		self.airline_id = airline_id
		self.origin = origin
		self.destination = destination
		self.cost = cost
		self.popularity = popularity
		self.offered_at = offered_at
		self.purchased_at = purchased_at
		self.next_available_at = next_available_at
		self.last_run_at = last_run_at
		self.last_resulted_at = last_resulted_at
		self.distance = self.calculate_distance()

	@staticmethod
	def from_db_row(db: DatabaseInterface, db_row: List[Any]):
		(
			route_id,
			airline_id,
			origin,
			destination,
			cost,
			popularity,
			offered_at,
			purchased_at,
			next_available_at,
			last_run_at,
			last_resulted_at,
		) = db_row
		return Route(
			route_id,
			airline_id,
			Airport.get_by_code(db, origin),
			Airport.get_by_code(db, destination),
			cost,
			popularity,
			offered_at,
			purchased_at,
			next_available_at,
			last_run_at,
			last_resulted_at,
		)

	@staticmethod
	def list_offered(db: DatabaseInterface, airline_id: int):
		return [
			Route.from_db_row(db, db_row) for db_row in db.list_offered_routes(airline_id)
		]

	@staticmethod
	def list_owned(db: DatabaseInterface, airline_id: int):
		return [Route.from_db_row(db, db_row) for db_row in db.list_owned_routes(airline_id)]

	@staticmethod
	def generate_offers(
		db: DatabaseInterface, airline: Airline, num_offers: int, existing_offers
	):
		LOGGER.info("Generating %s route offers for %s", num_offers, airline.name)
		hub: Airport = airline.hub
		airports = Airport.list(db)
		existing_routes = Route.list_owned(db, airline.id) + existing_offers
		existing_route_destinations = {r.destination.code for r in existing_routes}
		all_destinations = [
			airport
			for airport in airports
			if airport.code != hub.code
			and airport.code not in existing_route_destinations
			and airport.distance_from(hub) > 100
		]
		all_destinations.sort(key=lambda airport: airport.distance_from(hub))
		for destination in all_destinations[:num_offers]:
			# Generate appropriate popularity and cost
			popularity = random.randint(10, 100)
			cost = popularity * 100 + destination.distance_from(hub) + random.randint(1, 1000)
			db.create_route(airline.id, hub.code, destination.code, popularity, cost)
			LOGGER.info(
				"Created Route offer for %s: %s - %s", airline.name, hub.code, destination.code
			)

	@staticmethod
	def get_by_id(db: DatabaseInterface, route_id: int):
		return Route.from_db_row(db, db.get_route_by_id(route_id))

	@staticmethod
	def create(
		db: DatabaseInterface,
		airline_id: int,
		origin: str,
		destination: str,
		popularity: float,
		purchase_cost: int,
	):
		db_row = db.create_purchased_route(
			airline_id, origin, destination, popularity, purchase_cost,
		)
		(
			route_id,
			airline_id,
			_,
			_,
			popularity,
			purchase_cost,
			next_available_at,
			*_args,
		) = db_row
		origin_airport = Airport.by_code(db, origin)
		destination_airport = Airport.by_code(db, destination)
		return Route(
			airline_id,
			route_id,
			origin_airport,
			destination_airport,
			popularity,
			purchase_cost,
			next_available_at,
		)

	def purchase(self, db: DatabaseInterface):
		now_ts = datetime.utcnow()
		self.purchased_at = now_ts
		self.next_available_at = now_ts
		db.update_route(self.id, self.purchased_at, self.next_available_at)

	def run(self, airline):
		assert (
			self.next_available is None or self.next_available < datetime.utcnow()
		), "That route is already running!"
		assert (
			self.last_result is None or self.last_result > self.last_run
		), "Please collect the results from the previous run before running this route again"
		plane_to_use = None
		for plane in airline.planes:
			if plane.available_for_route(self):
				plane_to_use = plane
				break
		assert (
			plane_to_use is not None
		), f"No plane available to run this route (distance required is {self.distance}km) planes: {airline.planes}"
		plane_to_use.reserve(self)
		self.last_run = datetime.utcnow()
		self.next_available = self.last_run + timedelta(seconds=5 + self.distance / 20)
		return plane_to_use

	def collect(self, airline):
		assert (
			self.next_available and self.next_available < datetime.utcnow()
		), "This route has not finished yet!"
		assert self.last_run is not None, "This route has not been started!"
		assert (
			self.last_result is None or self.last_run > self.last_result
		), "These results have already been collected!"
		num_passengers = random.randint(10, 500)
		income = 100 * num_passengers
		cost = random.randint(500, 1000)
		plane_health_cost = random.randint(1, 10)
		popularity_change = random.randint(0, 1)

		if random.random() < 0.1:
			plane_health_cost += 5
			cost += 100
			popularity_change -= 2
			incident = "Smoke in cabin! See Accidents tab for details"
			# incidentText = `Smoke in cabin ${prettyCashString(eventCost)} and ${popularityChange} reputation`
		elif random.random() < 0.1:
			plane_health_cost += 25
			cost += 300
			popularity_change -= 10
			incident = "There was an engine fire! See Accidents tab for details"
			# incidentText = `Engine fire costing ${prettyCashString(eventCost)} and ${popularityChange} reputation`
		else:
			incident = None

		self.last_result = datetime.utcnow()
		airline.cash += income - cost
		airline.popularity += popularity_change
		if income >= cost:
			msg = (
				f"Route completed with {num_passengers} passengers and a profit of ${income - cost}"
			)
		else:
			msg = (
				f"Route completed with {num_passengers} passengers and a loss of ${cost - income}"
			)

		for plane in airline.planes:
			if plane.route == self:
				plane.health -= plane_health_cost
				plane.free()
				return msg, incident, plane
		raise RuntimeError(f"No plane found for route {self}")

	def calculate_distance(self) -> float:
		def deg2rad(deg):
			return deg * math.pi / 180

		R = 6371  # Radius of the earth in km
		dLat = deg2rad(self.destination.lat - self.origin.lat)
		# deg2rad below
		dLon = deg2rad(self.destination.lon - self.origin.lon)
		a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(
			deg2rad(self.origin.lat)
		) * math.cos(deg2rad(self.destination.lat)) * math.sin(dLon / 2) * math.sin(
			dLon / 2
		)
		c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
		d = R * c  # Distance in km
		return d

	@property
	def identifier(self):
		return f"{self.origin.code} <-> {self.destination.code}"
