import logging
import os

import psycopg2
import psycopg2.extras

LOGGER = logging.getLogger(__name__)

class PostgresqlDatabase:
	def __init__(self) -> None:
		self.conn = psycopg2.connect(os.environ["DATABASE_URL"], sslmode='require')
		LOGGER.info("Connected to database: %s", os.environ["DATABASE_URL"])

	def migrate(self):
		with self.conn.cursor() as cur:
			with open("001_initial.sql", "r") as f:
				cur.execute(f.read())

	def get_airports(self):
		airports = {}
		with self.conn.cursor() as cur:
			cur.execute("SELECT * FROM airport")
			for db_row in cur.fetchall():
				print(db_row)
		return airports