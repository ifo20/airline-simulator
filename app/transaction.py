from ctypes import Union
from datetime import datetime
import logging
import random
from typing import List

import pytz
from app.config import PLANE_COST, PLANE_FIX_COST, PLANE_MINIMUM_FLYING_HEALTH, PLANE_RANGE, PLANE_SCRAP_VALUE, PLANE_STARTING_HEALTH
from app.route import Route


class Transaction:
	def __init__(
		self,
		id: int,
		ts: datetime,
		airline_id: int,
		starting_cash: int,
		amount: int,
		description: str,
	):
		self.id = id
		self.ts = ts
		self.airline_id = airline_id
		self.starting_cash = starting_cash
		self.amount = amount
		self.description = description

	def __str__(self):
		return f"<Transaction A{self.airline_id}: {self.description} />"

	@classmethod
	def create(cls, db, airline, amount, description):
		db.save_transaction(airline, amount, description)

	@classmethod
	def from_db_row(cls, db_row):
		return cls(*db_row)
