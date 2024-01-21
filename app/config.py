PLANE_COST = {"min": 500000, "max": 3000000}
PLANE_RANGE = {"min": 500, "max": 16000}
PLANE_STARTING_HEALTH = 100
PLANE_MINIMUM_FLYING_HEALTH = 30
PLANE_FIX_COST = 100000
PLANE_SCRAP_VALUE = 300000

FUEL_COST_PER_KM = 20

TIME_SPEED = 1.0
DAMAGE_MULTIPLIER = 1.8
FLIGHT_PROFIT_HACK = 0

import locale
def pretty_price(price):
    locale.setlocale( locale.LC_ALL, 'en_US.utf-8')
    return f"{locale.currency(price, grouping=True)}"