import logging
import os
from typing import Any, List
import timeit

import psycopg2
import psycopg2.extras

from app.airline import Airline
from app.airport import Airport
from app.route import Route
from app.plane import Plane


class PostgresqlDatabase:
    def __init__(self):
        logging.info("Using a postgresql database")
        self.conn = None
        self.open()

    def open(self):
        start_ts = timeit.default_timer()
        self.conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode="require")
        logging.info("TIMER DB connection took %s", timeit.default_timer() - start_ts)

    def close(self):
        logging.info("Closing DB connection")
        self.conn.commit()
        self.conn.close()

    def execute(self, query: str, *args) -> None:
        logging.info("executing %s with args %s", query, tuple(args))
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(args))

    def fetch_one(self, query: str, *args) -> Any:
        logging.info("fetch_one executing %s with args %s", query, tuple(args))
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(args))
            result = cur.fetchone()
        return result

    def fetch_all(self, query: str, *args) -> List[Any]:
        logging.info("fetch_all executing %s with args %s", query, tuple(args))
        with self.conn.cursor() as cur:
            cur.execute(query, tuple(args))
            result = cur.fetchall()
        return result

    def migrate(self):
        with open("001_initial.sql", "r") as f:
            self.conn.cursor().execute(f.read())

    def get_airports(self) -> List[List[Any]]:
        return [
            Airport.from_db_row(db_row)
            for db_row in self.fetch_all("SELECT * FROM airports")
        ]

    def get_airport_by_code(self, code: str) -> List[Any]:
        db_row = self.fetch_one("SELECT * FROM airports WHERE code=%s", code)
        return Airport.from_db_row(db_row) if db_row else db_row

    def get_airlines(self) -> List[List[Any]]:
        return [
            Airline.from_db_row(db_row)
            for db_row in self.fetch_all("SELECT * FROM airlines")
        ]

    def get_airline_by_id(self, airline_id: int) -> List[Any]:
        db_row = self.fetch_one("SELECT * FROM airlines WHERE id=%s", airline_id)
        return Airline.from_db_row(db_row) if db_row else None

    def get_airline_by_name(self, name: str) -> List[Any]:
        db_row = self.fetch_one("SELECT * FROM airlines WHERE name=%s", name)
        return Airline.from_db_row(db_row) if db_row else None

    def create_airline(
        self, name: str, hub_code: str, starting_cash: int, starting_popularity: int
    ) -> List[Any]:
        logging.info("Inserting airline %s ...", name)
        [inserted_id] = self.fetch_one(
            """
INSERT INTO airlines (name, hub, joined_at, last_login_at, cash, popularity)
VALUES (%s, %s, now(), now(), %s, %s) RETURNING id
""",
            name,
            hub_code,
            starting_cash,
            starting_popularity,
        )
        logging.info("Inserted airline %s: %s", inserted_id, name)
        return self.get_airline_by_id(inserted_id)

    def save_airline(self, airline):
        return self.execute(
            "UPDATE airlines SET name=%s, hub=%s, joined_at=%s, last_login_at=%s, cash=%s, popularity=%s WHERE id=%s",
            airline.name,
            airline.hub,
            airline.joined_at,
            airline.last_login_at,
            airline.cash,
            airline.popularity,
            airline.id,
        )

    def list_offered_routes(self, airline_id: int):
        routes = []
        for row in self.fetch_all(
            "SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NULL",
            airline_id,
        ):
            routes.append(row)
        return routes

    def list_owned_routes(self, airline_id: int) -> List[List[Any]]:
        routes = []
        for row in self.fetch_all(
            "SELECT * FROM routes WHERE airline_id=%s AND purchased_at IS NOT NULL",
            airline_id,
        ):
            routes.append(row)
        return routes

    def get_route_by_id(self, route_id: int):
        return self.fetch_one("SELECT * FROM routes WHERE id=%s", route_id)

    def create_route(
        self,
        airline_id: int,
        origin: str,
        destination: str,
        cost: int,
        popularity: int,
    ):
        return self.fetch_one(
            """
INSERT INTO routes (airline_id, origin, destination, cost, popularity)
VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            airline_id,
            origin,
            destination,
            cost,
            popularity,
        )

    def save_route(self, route):
        return self.execute(
            "UPDATE routes SET purchased_at=%s, last_run_at=%s, last_resulted_at=%s, next_available_at=%s WHERE id=%s",
            route.purchased_at,
            route.last_run_at,
            route.last_resulted_at,
            route.next_available_at,
            route.route_id,
        )

    def list_offered_planes(self, airline_id: int):
        return [
            Plane.from_db_row(db_row)
            for db_row in self.fetch_all(
                "SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NULL",
                airline_id,
            )
        ]

    def list_owned_planes(self, airline_id: int):
        return [
            Plane.from_db_row(db_row)
            for db_row in self.fetch_all(
                "SELECT * FROM planes WHERE airline_id=%s AND purchased_at IS NOT NULL",
                airline_id,
            )
        ]

    def get_plane_by_id(self, plane_id: int):
        db_row = self.fetch_one("SELECT * FROM planes WHERE id=%s", plane_id)
        return Plane.from_db_row(db_row) if db_row else db_row

    def create_plane(self, plane):
        plane_id = self.fetch_one(
            """
INSERT INTO planes (airline_id, name, max_distance, cost)
VALUES (%s, %s, %s, %s) RETURNING id""",
            plane.airline_id,
            plane.name,
            plane.max_distance,
            plane.cost,
        )
        return plane_id

    def update_plane(self, plane):
        return self.execute(
            """
UPDATE planes
SET purchased_at=%s, health=%s, route_id=%s
WHERE id=%s""",
            plane.purchased_at,
            plane.health,
            plane.route.id if plane.route else None,
            plane.id,
        )

    def delete_plane(self, plane_id):
        return self.execute("DELETE FROM planes WHERE id=%s", plane_id)
