import json

from tinydb import TinyDB
from tinydb.storages import JSONStorage
from tinydb_serialization import SerializationMiddleware, Serializer
from tinydb_serialization.serializers import DateTimeSerializer

from app.airport import all_airports, Airport


class AirportSerializer(Serializer):
	OBJ_CLASS = Airport  # The class this serializer handles

	def encode(self, obj):
		return obj.__dict__

	def decode(self, s):
		return json.loads(s)


serialization = SerializationMiddleware(JSONStorage)
serialization.register_serializer(DateTimeSerializer(), "TinyDate")
serialization.register_serializer(AirportSerializer(), "Airport")
DB = TinyDB("db.json", storage=serialization)


def initialise():
	airports = DB.table("airport")
	# airports.truncate()
	# for airport in all_airports():
	# 	airports.insert(airport.db_dict())
	airlines = DB.table("airline")
	routes = DB.table("route")
	planes = DB.table("planes")
	return airports, airlines, routes, planes
