from datetime import datetime
import logging
import os
from typing import List

import psycopg2
import psycopg2.extras

from app.airline import STARTING_CASH, STARTING_POPULARITY, Airline
from app.airport import Airport

LOGGER = logging.getLogger(__name__)

class PostgresqlDatabase:
	def __init__(self) -> None:
		self.conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode='require')
		LOGGER.info("Connected to database: %s", os.environ["DATABASE_URL"])

	def migrate(self):
		with self.conn.cursor() as cur:
			with open("001_initial.sql", "r") as f:
				cur.execute(f.read())

	def get_airports(self) -> List[Airport]:
		airports = []
		with self.conn.cursor() as cur:
			cur.execute("SELECT * FROM airport")
			for db_row in cur.fetchall():
				airports.append(Airport(*db_row))
		return airports

	def get_airline_by_name(self, name: str) -> Airline:
		with self.conn.cursor() as cur:
			cur.execute("SELECT * FROM airline WHERE name=%s", (name,))
			return cur.fetchone()

	def get_airlines(self) -> List[Airline]:
		airlines = []
		with self.conn.cursor() as cur:
			cur.execute("SELECT * FROM airline")
			for db_row in cur.fetchall():
				airlines.append(Airline(*db_row))
		return airlines

	def create_airline(self, name: str, hub_code: str) -> Airline:
		now_ts = datetime.utcnow()
		with self.conn.cursor() as cur:
			cur.execute("INSERT INTO airline (name, hub, joined_at, last_login_at, cash, popularity) VALUES (%s, %s, %s, %s, %s, %s)", (name, hub_code, now_ts, now_ts, STARTING_CASH, STARTING_POPULARITY))


	def save_airline(self, airline: Airline) -> None:
		with self.conn.cursor() as cur:
			cur.execute("UPDATE airline SET last_login=%s WHERE id=%s", (airline.last_login, airline.id))
