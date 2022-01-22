from datetime import datetime

from tinydb import Query

from airport import Airport


class Airline:
	def __init__(
		self,
		name: str,
		hub: Airport,
		joined=None,
		last_login=None,
		cash=1000000,
		popularity=50,
	):
		self.name = name
		self.hub = hub
		self.joined = joined or datetime.utcnow()
		self.last_login = last_login or datetime.utcnow()
		self.cash = cash
		self.popularity = popularity
		self.planes = []
		self.routes = []
		self.transactions = []
		self.incidents = []

	@classmethod
	def from_db(cls, db_dict):
		return cls(**db_dict)

	def save(self, db):
		params = self.db_dict()
		db.update(params, Query().name == params["name"])

	def db_dict(self):
		return {
			"name": self.name,
			"hub": self.hub.code,
			"joined": self.joined,
			"last_login": self.last_login,
			"cash": self.cash,
			"popularity": self.popularity,
		}
