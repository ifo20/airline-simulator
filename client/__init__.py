"""A python client to demonstrate what one can do, and also to run tests with (rather than having to repeat experiments in the browser)"""
import random
import requests

from app.airline import STARTING_CASH


def generate_airline_name():
    adjectives = [
        "Blue",
        "Red",
        "Green",
        "Purple",
        "Orange",
        "White",
        "Trusty",
        "Speedy",
        "Enigmatic",
        "Fly",
        "Golden",
        "Sturdy",
        "Graceful",
        "Rapid",
        "Robust",
        "American",
        "British",
        "Asian",
        "European",
        "Indian",
        "Italian",
        "Australian",
        "Chinese",
        "Russian",
        "Nordic",
        "Southern",
        "Northern",
        "Southwest",
        "Express",
        "Paper",
        "Malaysia",
        "Thai",
    ]
    nouns = [
        "Planes",
        "Airways",
        "Skies",
        "Air",
        "Airlines",
        "Flyers",
        "Jets",
        "Pilots",
        "Air Transport",
        "Helicopters",
        "Cargo",
    ]
    name = random.choice(adjectives) + " " + random.choice(nouns)
    if random.random() < 0.3:
        name = random.choice(adjectives) + " " + name
    return name


def assertAssertionError(f, *args, **kwargs):
    try:
        f(*args, **kwargs)
    except Exception as e:
        if isinstance(e, requests.exceptions.HTTPError) and str(e).startswith(
            "400 Client Error"
        ):
            pass
        else:
            raise e


class JIASClient:
    HOST = "http://localhost:8000/"

    def __init__(self) -> None:
        self.session = requests.session()

    def get(self, path, params=None):
        resp = self.session.get(self.HOST + path, params=params)
        if resp.status_code < 400:
            return resp.json()
        resp.raise_for_status()

    def post(self, path, data):
        resp = self.session.post(self.HOST + path, data=data)
        if resp.status_code < 400:
            return resp.json()
        resp.raise_for_status()

    def get_airports(self):
        return self.get("airports")

    def create_airline_or_login(self, name, hub):
        return self.post("play", {"businessName": name, "hub": hub})

    def get_offered_planes(self, airline_id):
        return self.get("offered_planes", {"airline_id": airline_id})

    def get_owned_planes(self, airline_id):
        return self.get("owned_planes", {"airline_id": airline_id})

    def buy_plane(self, airline_id, plane_id):
        return self.post(
            "purchase_plane", {"airline_id": airline_id, "plane_id": plane_id}
        )

    def get_offered_routes(self, airline_id):
        return self.get("offered_routes", {"airline_id": airline_id})

    def get_owned_routes(self, airline_id):
        return self.get("owned_routes", {"airline_id": airline_id})

    def buy_route(self, airline_id, route_id):
        return self.post(
            "purchase_route", {"airline_id": airline_id, "route_id": route_id}
        )

    def fly_route(self, airline_id, route_id, plane_id):
        return self.post(
            "fly_route",
            {"airline_id": airline_id, "route_id": route_id, "plane_id": plane_id},
        )


c = JIASClient()
my_hub = random.choice(c.get_airports())
# we should be able to create an airline with any advertised hub
airline_name = generate_airline_name()
airline_response = c.create_airline_or_login(airline_name, my_hub["code"])
airline_id = airline_response["id"]
assert isinstance(airline_id, int)
print("Checking planes...")
# we should be able to buy any advertised plane
offered_planes = c.get_offered_planes(airline_id)
plane = random.choice(offered_planes)
bought_planes = [c.buy_plane(airline_id, plane["id"])]
# Buy the remaining planes for convenience
for p in offered_planes:
    if p["id"] != plane["id"]:
        bought_planes.append(c.buy_plane(airline_id, p["id"]))
shortest_offers_first = sorted(
    offered_planes, key=lambda p: (p["max_distance"], p["id"])
)
# Check they are now owned
owned_planes = c.get_owned_planes(airline_id)
shortest_owned_first = sorted(owned_planes, key=lambda p: p["max_distance"])
assert len(shortest_offers_first) == len(shortest_owned_first)
for offer, owned in zip(shortest_offers_first, shortest_owned_first):
    assert offer["max_distance"] == owned["max_distance"]
    assert owned["status"] == "Available"
print("Plane check complete")

print("Checking routes...")
offered_routes = c.get_offered_routes(airline_id)
for r in offered_routes:
    c.buy_route(airline_id, r["id"])
owned_routes = c.get_owned_routes(airline_id)
live_flights = set()  # (r_id, p_id)
for p, r in zip(shortest_owned_first, owned_routes):
    if p["max_distance"] > r["distance"]:
        c.fly_route(airline_id, r["id"], p["id"])
        live_flights.add((r["id"], p["id"]))
    else:
        assertAssertionError(c.fly_route, airline_id, r["id"], p["id"])

for r_id, p_id in live_flights:
    assertAssertionError(c.fly_route, airline_id, r_id, p_id)
print("Route check complete")

print("Checking finances...")
latest_airline = c.create_airline_or_login(airline_name, my_hub["code"])
assert latest_airline["cash"] < STARTING_CASH
