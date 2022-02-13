from datetime import datetime, timedelta
import random

from app.airport import Airport
from app.airline import Airline


class RouteBase:
	def __init__(
		self, origin: Airport, destination: Airport, popularity: int, purchase_cost: int
	) -> None:
		self.origin: Airport = origin
		self.destination: Airport = destination
		self.distance = self.origin.distance_from(self.destination)
		self.popularity = popularity
		self.purchase_cost = purchase_cost

	@property
	def identifier(self):
		return f"{self.origin.code} <-> {self.destination.code}"


class OfferedRoute(RouteBase):
	def __init__(self, origin: Airport, destination: Airport) -> None:
		popularity = random.randint(10, 100)
		super().__init__(
			origin, destination, popularity, popularity * 100 + random.randint(1, 1000)
		)


class PurchasedRoute(RouteBase):
	def __init__(
		self, origin: Airport, destination: Airport, popularity, purchase_cost
	) -> None:
		super().__init__(origin, destination, popularity, purchase_cost)
		self.last_run = None
		self.last_result = None
		self.next_available = None

	def __str__(self):
		return f"<PurchasedRoute {self.origin.code} <-> {self.destination.code} />"

	def save(self, db, airline: Airline):
		params = self.db_dict(airline)
		airline_name = params.pop("airline")
		db.update(params, Query().airline == airline_name)

	def db_dict(self, airline: Airline):
		return {
			"airline": airline.name,
			"origin": self.origin.code,
			"destination": self.destination.code,
			"popularity": self.popularity,
			"purchase_cost": self.purchase_cost,
			"last_run": self.last_run,
			"last_result": self.last_result,
			"next_available": self.next_available,
		}

	def run(self, airline: Airline):
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

	def collect(self, airline: Airline):
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
