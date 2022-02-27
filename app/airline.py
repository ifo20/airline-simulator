from datetime import datetime, tzinfo

import pytz

from app.airport import Airport
from app.db import DatabaseInterface

STARTING_CASH = 1000000
STARTING_POPULARITY = 50


class Airline:
	def __init__(
		self,
		id: int,
		name: str,
		hub: Airport,
		joined_at=None,
		last_login_at=None,
		cash=STARTING_CASH,
		popularity=STARTING_POPULARITY,
	):
		self.id = id
		self.name = name
		self.hub = hub
		self.joined_at = joined_at or datetime.now(tzinfo=pytz.UTC)
		self.last_login_at = last_login_at or datetime.now(pytz.UTC)
		self.cash = cash
		self.popularity = popularity

	@staticmethod
	def list(db: DatabaseInterface):
		airlines = []
		for (
			airline_id,
			name,
			hub,
			joined_at,
			last_login_at,
			cash,
			popularity,
		) in db.get_airlines():
			hub_airport = Airport.get_by_code(db, hub)
			airlines.append(
				Airline(airline_id, name, hub_airport, joined_at, last_login_at, cash, popularity)
			)
		return airlines

	@staticmethod
	def get_by_id(db: DatabaseInterface, airline_id: int):
		result = db.get_airline_by_id(airline_id)
		if result is None:
			return result
		(
			airline_id,
			name,
			hub,
			joined_at,
			last_login_at,
			cash,
			popularity,
		) = result
		hub_airport = Airport.get_by_code(db, hub)
		return Airline(
			airline_id, name, hub_airport, joined_at, last_login_at, cash, popularity
		)

	@staticmethod
	def get_by_name(db: DatabaseInterface, airline_name: str):
		(
			airline_id,
			name,
			hub,
			joined_at,
			last_login_at,
			cash,
			popularity,
		) = db.get_airline_by_name(airline_name)
		hub_airport = Airport.get_by_code(db, hub)
		return Airline(
			airline_id, name, hub_airport, joined_at, last_login_at, cash, popularity
		)

	@staticmethod
	def login(db: DatabaseInterface, airline_name: str, hub: str):
		"""For now, we simply register if the airline does not yet exist"""
		try:
			airline = Airline.get_by_name(db, airline_name)
		except TypeError:
			db_row = db.create_airline(airline_name, hub, STARTING_CASH, STARTING_POPULARITY)
			airline_id, name, hub, joined_at, last_login_at, cash, popularity = db_row
			hub_airport = Airport.get_by_code(db, hub)
			return Airline(
				airline_id, name, hub_airport, joined_at, last_login_at, cash, popularity
			)
		db.update_last_login_at(airline.id)
		return airline

	@staticmethod
	def update_cash(db: DatabaseInterface, airline_id: int, new_cash: int):
		db.update_airline_cash(airline_id, new_cash)

	def update_for_route_collection(self, db: DatabaseInterface):
		db.update_airline(self)
