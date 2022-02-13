import random

from app.airline import Airline


class PlaneBase:
	def __init__(self, id, name, max_distance, purchase_cost):
		self.id = id
		self.name = name
		self.max_distance = max_distance
		self.purchase_cost = purchase_cost


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


class Plane(PlaneBase):
	def __init__(self, id, name, max_distance, purchase_cost):
		super().__init__(id, name, max_distance, purchase_cost)
		self.route = None
		self.health = 100

	@property
	def status(self):
		if self.route:
			return f"Flying {self.route.origin.code} <-> {self.route.destination.code}"
		if self.health < 30:
			return "Requires maintenance"
		return "Available"

	def save(self, db, airline: Airline):
		params = self.db_dict(airline)
		airline_name = params.pop("airline")
		db.update(params, Query().airline == airline_name)

	def db_dict(self, airline):
		return {
			"id": self.id,
			"name": self.name,
			"max_distance": self.max_distance,
			"purchase_cost": self.purchase_cost,
			"airline": airline.name,
			"health": self.health,
		}

	def available_for_route(self, route):
		return self.route is None and self.max_distance > route.distance

	def reserve(self, route):
		self.route = route

	def free(self):
		self.route = None


class PlaneStore:
	def __init__(self):
		self.planes = {}
		self.next_id = 1
		self.min_cost = 100000
		self.min_distance = 500
		self.max_distance = 16000
		for _ in range(5):
			self.create_plane()

	def list_for_sale(self):
		return list(self.planes.values())

	def create_plane(self):
		distance = random.randint(self.min_distance, self.max_distance)
		cost = self.min_cost + distance * 20
		plane = Plane(self.next_id, generate_name(), distance, cost)
		self.next_id += 1
		self.planes[plane.id] = plane

	def purchase_plane(self, plane_id, airline):
		plane = self.planes[plane_id]
		assert airline.cash > plane.purchase_cost, "You cannot afford this plane!"
		plane = self.planes.pop(plane_id)
		airline.cash -= plane.purchase_cost
		plane.airline = airline.name
		airline.planes.append(plane)
		self.create_plane()
		return plane
