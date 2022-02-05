import math
from typing import List


class Airport:
	def __init__(self, code, name, country, lat, lon, popularity) -> None:
		self.code = code.upper()
		self.name = name
		self.country = country
		self.lat = lat
		self.lon = lon
		self.popularity = popularity

	@classmethod
	def from_db(cls, db_dict):
		return cls(**db_dict)

	def db_dict(self):
		return self.__dict__

	def distance_from(self, other):
		"""Returns distance in kilometres"""

		def deg2rad(deg):
			return deg * math.pi / 180

		R = 6371  # Radius of the earth in km
		dLat = deg2rad(other.lat - self.lat)
		# deg2rad below
		dLon = deg2rad(other.lon - self.lon)
		a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(deg2rad(self.lat)) * math.cos(
			deg2rad(other.lat)
		) * math.sin(dLon / 2) * math.sin(dLon / 2)
		c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
		d = R * c  # Distance in km
		return d


def all_airports() -> List[Airport]:
	return [
		Airport("LHR", "London Heathrow", "United Kingdom", 51.4775, -0.461388, 80.1),
		Airport("CDG", "Charles de Gaulle Airport", "France", 49.009722, 2.547778, 69.5),
		Airport("FRA", "Frankfurt International Airport", "Germany", 50.0379, 8.5622, 71.0),
		# North America
		Airport("JFK", "John F. Kennedy Airport", "USA", 40.6413, 73.7781, 71.9),
		Airport(
			"IAD", "Washington Dulles International Airport", "USA", 38.9531, 77.4565, 51.9
		),
		# South America
		# Asia
		Airport(
			"KUL", "Kuala Lumpur International Airport", "Malaysia", 2.743333, 101.698056, 60.0
		),
		Airport(
			"HKG", "Hong Kong International Airport", "Hong Kong", 22.308889, 113.914444, 71.4
		),
		Airport(
			"BKK", "Suvarnabhumi International Airport", "Thailand", 13.6900, 100.7501, 65.4
		),
		Airport("SIN", "Changi International Airport", "Singapore", 1.3644, 103.9915, 91.0),
		# Africa
		Airport(
			"CPT", "Cape Town International Airport", "South Africa", 33.9715, 18.6021, 56.5
		),
		# Middle East
		Airport("DXB", "Dubai International Airport", "UAE", 25.2532, 55.3657, 91.2),
	]
