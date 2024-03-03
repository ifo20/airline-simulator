from datetime import datetime


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
		return cls(*db.save_transaction(airline, amount, description))

	@classmethod
	def from_db_row(cls, db_row):
		return cls(*db_row)

	@staticmethod
	def list(db, airline_id):
		return [
			Transaction.from_db_row(db_row)
			for db_row in db.get_transactions(airline_id)
		]
