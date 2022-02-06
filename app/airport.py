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
		Airport("AUH", "Abu Dhabi International Airport", "UAE", 24.4331, 54.6511, 90.5),
		Airport(
			"JED", "King Abdulaziz International Airport", "Saudi Arabia", 21.6805, 39.1752, 85.6
		),
		Airport(
			"RUH", "King Khalid International Airport", "Saudi Arabia", 24.9578, 46.6989, 77.4
		),
		Airport(
			"AMM", "Amman Queen Alia International Airport", "Jordan", 31.7225, 35.9933, 65.8
		),
		Airport("MCT", "Muscat Airport", "Oman", 23.5928, 58.2817, 71.8),
		Airport("SLL", "Salalah Airport", "Oman", 17.0386, 54.0914, 73.8),
		Airport("MHD", "Mashhad Airport", "Iran", 36.2342, 59.645, 72.5),
		Airport(
			"IKA", "Tehran Imam Khomeini International Airport", "Iran", 35.4161, 51.1522, 72.5
		),
		Airport(
			"THR", "Tehran Mehrabad International Airport", "Iran", 35.6889, 51.3147, 72.5
		),
		Airport("BND", "Bandar Abbas Airport", "Iran", 27.2186, 56.3778, 69.7),
		Airport("BGW", "Baghdad Airport", "Iraq", 33.2625, 44.2344, 55.8),
		Airport("KWI", "Kuwait Airport", "Kuwait", 29.2267, 47.9689, 58.8),
		Airport(
			"DAM",
			"Damascus International Airport",
			"Syria Arab Republic",
			33.4106,
			36.5144,
			67.6,
		),
		Airport("SAH", "Sana'a International Airport", "Yemen", 15.4792, 44.2197, 55.8),
		Airport("ADE", "Aden International Airport", "Yemen", 12.8254, 45.0371, 56.5),
		Airport("BAH", "Bahrain Airport", "Bahrain", 26.2708, 50.6336, 67.6),
		Airport(
			"TLV", "Tel Aviv Ben Gurion International Airport", "Israel", 32.0114, 34.8867, 72.2
		),
		Airport("BEY", "Beirut Airport", "Lebanon", 33.8208, 35.4883, 65.9),
		Airport(
			"DOH", "Hamad International Airport Information", "Qatar", 25.2606, 51.6138, 69.9
		),
	]
