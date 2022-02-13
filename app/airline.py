from datetime import datetime

from app.airport import Airport

STARTING_CASH = 1000000
STARTING_POPULARITY = 50

class Airline:
	def __init__(
		self,
		id: int,
		name: str,
		hub: Airport,
		joined=None,
		last_login=None,
		cash=STARTING_CASH,
		popularity=STARTING_POPULARITY,
	):
		self.id = id
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
