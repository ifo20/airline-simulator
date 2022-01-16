from datetime import datetime, timedelta
import random

from airport import Airport
from airline import Airline


class RouteBase:
	def __init__(
		self, origin: Airport, destination: Airport, popularity: int, purchase_cost: int
	) -> None:
		self.origin: Airport = origin
		self.destination: Airport = destination
		self.distance = self.origin.distance_from(self.destination)
		self.popularity = popularity
		self.purchase_cost = purchase_cost


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
		self.plane = None

	def __str__(self):
		return f"<PurchasedRoute {self.origin.code} <-> {self.destination.code} />"

	def db_dict(self, airline: Airline):
		return {
			"airline": airline.name,
			"origin": self.origin.code,
			"destination": self.destination.code,
			"popularity": self.popularity,
			"purchase_cost": self.purchase_cost,
			"last_run": self.last_run,
			"next_available": self.next_available,
		}

	def run(self):
		assert self.next_available is None or self.next_available
		self.last_run = datetime.now()
		self.next_available = self.last_run + timedelta(seconds=60 + self.distance / 20)

	def collect(self, airline: Airline):
		# assert self.next_available < datetime.now()
		num_passengers = random.randint(10, 300)
		income = 10 * num_passengers
		cost = random.randint(500, 1000)
		airline.cash += income - cost
		if income >= cost:
			msg = f"Route completed with {num_passengers} passengers and a profit of ${income - cost}"
		else:
			msg = f"Route completed with {num_passengers} passengers and a loss of ${cost - income}"
		
		if random.random() < 0.1:
			event_cost = random.randint(2000, 4000)
			popularity_change = 5
			incident = "There was an engine fire! See Accidents tab for details"
			# incidentText = `Engine fire costing ${prettyCashString(eventCost)} and ${popularityChange} reputation`
		elif random.random() < 0.1:
			event_cost = random.randint(100, 300)
			popularity_change = 1
			incident = "Smoke in cabin! See Accidents tab for details"
			# incidentText = `Smoke in cabin ${prettyCashString(eventCost)} and ${popularityChange} reputation`
		else:
			incident = None
		return msg, incident
