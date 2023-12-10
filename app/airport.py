import math
from typing import List


class Airport:
    def __init__(
        self,
        code: str,
        name: str,
        country: str,
        lat: float,
        lon: float,
        popularity: float,
    ) -> None:
        self.code = code.upper()
        self.name = name
        self.country = country
        self.lat = lat
        self.lon = lon
        self.popularity = popularity

    @classmethod
    def from_db_row(cls, db_row):
        return cls(*db_row)

    @staticmethod
    def get_by_code(db, code: str):
        return db.get_airport_by_code(code)

    def can_fly_to(self, other) -> bool:
        return (self.country, other.country) not in {
            ("Iran", "Iraq"),
            ("Iraq", "Iran"),
        }

    def distance_from(self, other):
        """Returns distance in kilometres"""

        def deg2rad(deg):
            return deg * math.pi / 180

        R = 6371  # Radius of the earth in km
        dLat = deg2rad(other.lat - self.lat)
        # deg2rad below
        dLon = deg2rad(other.lon - self.lon)
        a = math.sin(dLat / 2) * math.sin(dLat / 2) + math.cos(
            deg2rad(self.lat)
        ) * math.cos(deg2rad(other.lat)) * math.sin(dLon / 2) * math.sin(dLon / 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        d = R * c  # Distance in km
        return d
