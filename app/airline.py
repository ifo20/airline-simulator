from datetime import datetime
import logging
import pytz

from app.airport import Airport

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

    @classmethod
    def from_db_row(cls, db_row):
        return cls(*db_row)

    @staticmethod
    def get_by_id(db, airline_id: int):
        return db.get_airline_by_id(airline_id)

    @staticmethod
    def get_by_name(db, airline_name: str):
        return db.get_airline_by_name(airline_name)

    @classmethod
    def login(cls, db, airline_name: str, hub: str):
        """For now, we simply register if the airline does not yet exist"""
        logging.info("LOGIN LOGIN LOGIN %s %s", airline_name, hub)
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
            db.create_airline(airline)
            logging.info("Created airline %s: %s", airline.id, airline.name)
        hub_airport = Airport.get_by_code(db, hub)
        airline.hub = hub_airport
        return airline

    @staticmethod
    def leaderboard(db):
        return sorted(
            db.get_airlines(),
            key=lambda airline: (airline.popularity, airline.cash),
            reverse=True,
        )
