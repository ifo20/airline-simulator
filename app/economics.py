import random
from app.config import DAMAGE_MULTIPLIER, FLIGHT_PROFIT_HACK, pretty_price

def calculate_fuel_cost(distance, num_passengers, fuel_efficiency_level):
    # Nowadays the fuel consumption is usually around 3 to 4 liters per passenger per 100 kilometers,
    fuel_efficiency_level = min(fuel_efficiency_level,5)
    fuel_efficiency_level = max(fuel_efficiency_level,0)
    FUEL_LITRES_PER_PERSON_PER_100_KM = {
        # upgraded_levels: litres per passenger per 100 km
        0: 6,
        1: 5,
        2: 4,
        3: 3,
        4: 2.5,
        5: 2,
    }
    fuel_litres_per_person_per_100km = FUEL_LITRES_PER_PERSON_PER_100_KM[fuel_efficiency_level]
    fuel_litres_required = (distance / 100) * num_passengers * fuel_litres_per_person_per_100km
    dollars_per_litre = 1.5
    return int(fuel_litres_required * dollars_per_litre)


def route_logic(airline_name, distance, fuel_efficiency_level=0):
    num_passengers = random.randint(100, 350)
    price_per_passenger = 75 + distance/13
    income = price_per_passenger * num_passengers

    if "Golden" in airline_name:
        income *= 3
    fuel_cost = calculate_fuel_cost(distance, num_passengers, fuel_efficiency_level)
    catering_cost_per_passenger = 40
    catering_cost = num_passengers * catering_cost_per_passenger
    random_adjustment = random.randint(0, 1000)
    cost = fuel_cost + catering_cost + random_adjustment
    if "Sturdy" in airline_name or "Robust" in airline_name:
        plane_health_cost = 0
        fire_prob = 0.000001
        smoke_prob = 0.01

    else:
        plane_health_cost = random.randint(1, 10)
        fire_prob = 0.01
        smoke_prob = 0.1

    popularity_change = random.randint(0, 1)  # ev: 0.5

    if "Trusty" in airline_name:
        popularity_change += 1

    if random.random() < fire_prob:
        plane_health_cost += 25
        cost += 300
        popularity_change -= 10  # ev -0.1 -> 0.4
        incident = (
            f"Engine fire! Plane health {plane_health_cost} Popularity {popularity_change}"
        )
    elif random.random() < smoke_prob:
        plane_health_cost += 5
        cost += 100
        popularity_change -= 2  # ev: -0.18 -> 0.22
        incident = (
            f"Smoke in cabin! Plane health {plane_health_cost} Popularity {popularity_change}"
        )
    else:
        incident = None

    cash_change = int(income - cost)
    
    if cash_change >= 0:
        msg = (
            f"Route completed with {num_passengers} passengers and a profit of {pretty_price(income - cost)}"
        )
    else:
        msg = (
            f"Route completed with {num_passengers} passengers and a loss of {pretty_price(cost - income)}"
        )
        
    plane_health_cost *= DAMAGE_MULTIPLIER
    cash_change += FLIGHT_PROFIT_HACK
    return cash_change, popularity_change, plane_health_cost, incident, msg