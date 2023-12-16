"""
This module only saves state in-memory, so if the server is restarted, all state is lost.

So it is not really a database - hence the name 'mock'
"""
import logging
import json
from typing import List, Optional
from app.airline import Airline

from app.airport import Airport
from app.plane import Plane
from app.route import Route


class MockDatabase:
    def __init__(self):
        logging.info("Using a mock database ... progress will not be saved")
        # Store everything as a dict keyed by primary key
        self.airports = {}
        self.airlines = {}
        self.routes = {}
        self.planes = {}

    def open(self):
        self.airports = {
            airport[0]: Airport(*airport)
            for airport in json.load(open("data/airports.json"))
        }

    def close(self):
        pass

    def migrate(self):
        pass

    def get_airports(self) -> List[Airport]:
        return list(self.airports.values())

    def get_airport_by_code(self, code: str) -> Optional[Airport]:
        return self.airports.get(code)

    def get_airlines(self) -> List[Airline]:
        return list(self.airlines.values())

    def get_airline_by_id(self, airline_id: int) -> Optional[Airline]:
        return self.airlines.get(int(airline_id))

    def get_airline_by_name(self, name: str) -> Optional[Airline]:
        for airline in self.airlines.values():
            if airline.name == name:
                return airline

    def create_airline(self, airline: Airline) -> int:
        airline_id = len(self.airlines)
        airline.id = airline_id
        self.save_airline(airline)
        return airline_id

    def save_airline(self, airline: Airline):
        logging.info("save_airline %s %s", airline, airline.cash)
        self.airlines[airline.id] = airline

    def list_offered_routes(self, airline_id: int) -> List[Route]:
        routes = []
        for route in self.routes.values():
            if route.airline_id == airline_id and route.purchased_at is None:
                routes.append(route)
        return routes

    def list_owned_routes(self, airline_id: int) -> List[Route]:
        routes = []
        for route in self.routes.values():
            if route.airline_id == airline_id and route.purchased_at is not None:
                routes.append(route)
        return routes

    def get_route_by_id(self, route_id: int) -> Optional[Route]:
        return self.routes.get(int(route_id))

    def create_route(self, route: Route) -> int:
        route_id = len(self.routes)
        self.routes[route_id] = route
        route.id = route_id
        logging.debug("C|reated route %s , routes=%s", route_id, self.routes)
        return route_id

    def save_route(self, route: Route):
        self.routes[route.id] = route

    def list_offered_planes(self, airline_id: int) -> List[Plane]:
        planes = []
        for plane in self.planes.values():
            if plane.airline_id == airline_id and plane.purchased_at is None:
                planes.append(plane)
        return planes

    def list_owned_planes(self, airline_id: int) -> List[Plane]:
        planes = []
        for plane in self.planes.values():
            if plane.airline_id == airline_id and plane.purchased_at is not None:
                planes.append(plane)
        return planes

    def get_plane_by_id(self, plane_id: int) -> Optional[Plane]:
        return self.planes[plane_id]

    def create_plane(self, plane: Plane) -> int:
        plane_id = len(self.planes)
        self.planes[plane_id] = plane
        return plane_id

    def save_plane(self, plane: Plane):
        self.planes[plane.id] = plane

    def delete_plane(self, plane_id: int):
        del self.planes[plane_id]
