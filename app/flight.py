from datetime import datetime


class Flight:
	def __init__(
		self,
		id: int,
		route_id: int,
		plane_id: int,
		departed_at: datetime,
		arrived_at: datetime,
		num_passengers: int,
		income: int,
		cost: int,
		plane_health_cost: int,
	):
		self.id = id
		self.route_id = route_id
		self.plane_id = plane_id
		self.departed_at = departed_at
		self.arrived_at = arrived_at
		self.num_passengers = num_passengers
		self.income = income
		self.cost = cost
		self.plane_health_cost = plane_health_cost

	def __str__(self):
		return f"<Flight {self.id} />"

	@classmethod
	def create(cls, db, route_id, plane_id, departed_at, arrived_at, num_passengers, income, cost, plane_health_cost):
		db.save_flight(route_id, plane_id, departed_at, arrived_at, num_passengers, income, cost, plane_health_cost)

	@classmethod
	def from_db_row(cls, db_row):
		return cls(*db_row)
