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

	def db_dict(self, airline: Airline):
		return {
			"airline": airline.name,
			"origin": self.origin.code,
			"destination": self.destination.code,
			"popularity": self.popularity,
			"purchase_cost": self.purchase_cost,
		}
