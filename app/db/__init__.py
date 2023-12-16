"""
In this db folder, we store 'database implementations'

To run the server, we must choose one implementation.
Currently, we have two implementations to choose from:
1. MockDatabase. This doesn't really save anything
2. PostgresqlDatabase. This saves to a Postgresql database (you'll need to set one up in order to use it)

Each implementation must write a lot of functions to save game state, for example:

    def create_airline(self, airline: Airline) -> int:
    def create_route(self, route: Route) -> int:
    def create_plane(self, plane: Plane) -> int:

    def save_airline(self, airline: Airline):
    def save_route(self, route: Route):
    def save_plane(self, plane: Plane):
    
    def list_offered_routes(self, airline_id: int) -> List[Route]:
    def list_owned_routes(self, airline_id: int) -> List[Route]:
    def list_offered_planes(self, airline_id: int) -> List[Plane]:
    def list_owned_planes(self, airline_id: int) -> List[Plane]:

"""
import os
import platform

from .mock import MockDatabase
from .postgresql import PostgresqlDatabase


def get_db():
	cls = get_db_type()
	return cls()


def get_db_type():
	if platform.system() == "Windows" or "DATABASE_URL" not in os.environ:
		return MockDatabase
	else:
		return PostgresqlDatabase


DatabaseInterface = get_db_type()
