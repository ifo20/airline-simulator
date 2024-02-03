from datetime import datetime
import logging
from typing import Union
import pytz

from app.airport import Airport

STARTING_CASH = 30000000
STARTING_POPULARITY = 50


class Airline:
	def __init__(
		self,
		id: int,
		name: str,
		hub: Union[
			str, Airport
		],  # sometimes this is a string representing the airport code, generally it should be the Airport object itself
		joined_at=None,
		last_login_at=None,
		cash=STARTING_CASH,
		popularity=STARTING_POPULARITY,
		fuel_efficiency_level=0
	):
		self.id = id
		self.name = name
		self.hub = hub
		self.joined_at = joined_at or datetime.now(tzinfo=pytz.UTC)
		self.last_login_at = last_login_at or datetime.now(pytz.UTC)
		self.cash = cash
		self.popularity = popularity
		self.fuel_efficiency_level = fuel_efficiency_level

	@classmethod
	def from_db_row(cls, db_row):
		return cls(*db_row)

	def load_fields(self, db):
		if isinstance(self.hub,Airport):
			return
		self.hub = Airport.get_by_code(db, self.hub)
		logging.info("load_fields: hub is now %s", self.hub)

	@staticmethod
	def get_by_id(db, airline_id: int):
		base = db.get_airline_by_id(airline_id)
		logging.info("got airline by id, hub is %s", base.hub)
		if base:
			base.load_fields(db)
		return base

	@staticmethod
	def get_by_name(db, airline_name: str):
		base = db.get_airline_by_name(airline_name)
		if base:
			base.load_fields(db)
		return base

	@classmethod
	def login(cls, db, airline_name: str, hub: str):
		"""For now, we simply register if the airline does not yet exist"""
		logging.info("LOGIN airline_name=%s hub=%s", airline_name, hub)
		now_ts = datetime.now()
		airline = Airline.get_by_name(db, airline_name)
		if airline:
			airline.last_login_at = now_ts
			db.save_airline(airline)
		else:
			airline = cls(
				id=None,
				name=airline_name,
				hub=hub,
				joined_at=now_ts,
				last_login_at=now_ts,
				cash=STARTING_CASH,
				popularity=STARTING_POPULARITY,
			)
			airline_id = db.create_airline(airline)
			airline.id = airline_id
			logging.info("Created airline %s: %s", airline.id, airline.name)
		hub_airport = Airport.get_by_code(db, hub)
		airline.hub = hub_airport
		logging.info("airlinehub is %s",airline.hub)
		return airline

	@staticmethod
	def leaderboard(db):
		return sorted(
			db.get_airlines(),
			key=lambda airline: (airline.popularity, airline.cash),
			reverse=True,
		)
