BEGIN;
CREATE TABLE IF NOT EXISTS airport (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    popularity REAL NOT NULL
);
INSERT INTO airport (code, name, country, latitude, longitude, popularity) VALUES
('LHR', 'London Heathrow', 'United Kingdom', 51.4775, -0.461388, 80.1),
('CDG', 'Charles de Gaulle Airport', 'France', 49.009722, 2.547778, 69.5),
('FRA', 'Frankfurt International Airport', 'Germany', 50.0379, 8.5622, 71.0),
('JFK', 'John F. Kennedy Airport', 'USA', 40.6413, 73.7781, 71.9),
('IAD', 'Washington Dulles International Airport', 'USA', 38.9531, 77.4565, 51.9),
('KUL', 'Kuala Lumpur International Airport', 'Malaysia', 2.743333, 101.698056, 60.0),
('HKG', 'Hong Kong International Airport', 'Hong Kong', 22.308889, 113.914444, 71.4),
('BKK', 'Suvarnabhumi International Airport', 'Thailand', 13.6900, 100.7501, 65.4),
('SIN', 'Changi International Airport', 'Singapore', 1.3644, 103.9915, 91.0),
('CPT', 'Cape Town International Airport', 'South Africa', 33.9715, 18.6021, 56.5),
('DXB', 'Dubai International Airport', 'UAE', 25.2532, 55.3657, 91.2),
('AUH', 'Abu Dhabi International Airport', 'UAE', 24.4331, 54.6511, 90.5),
('JED', 'King Abdulaziz International Airport', 'Saudi Arabia', 21.6805, 39.1752, 85.6),
('RUH', 'King Khalid International Airport', 'Saudi Arabia', 24.9578, 46.6989, 77.4),
('AMM', 'Amman Queen Alia International Airport', 'Jordan', 31.7225, 35.9933, 65.8),
('MCT', 'Muscat Airport', 'Oman', 23.5928, 58.2817, 71.8),
('SLL', 'Salalah Airport', 'Oman', 17.0386, 54.0914, 73.8),
('MHD', 'Mashhad Airport', 'Iran', 36.2342, 59.645, 72.5),
('IKA', 'Tehran Imam Khomeini International Airport', 'Iran', 35.4161, 51.1522, 72.5),
('THR', 'Tehran Mehrabad International Airport', 'Iran', 35.6889, 51.3147, 72.5),
('BND', 'Bandar Abbas Airport', 'Iran', 27.2186, 56.3778, 69.7),
('BGW', 'Baghdad Airport', 'Iraq', 33.2625, 44.2344, 55.8),
('KWI', 'Kuwait Airport', 'Kuwait', 29.2267, 47.9689, 58.8),
('DAM',	'Damascus International Airport', 'Syria Arab Republic', 33.4106, 36.5144, 67.6),
('SAH', 'Sanaa International Airport', 'Yemen', 15.4792, 44.2197, 55.8),
('ADE', 'Aden International Airport', 'Yemen', 12.8254, 45.0371, 56.5),
('BAH', 'Bahrain Airport', 'Bahrain', 26.2708, 50.6336, 67.6),
('TLV', 'Tel Aviv Ben Gurion International Airport', 'Israel', 32.0114, 34.8867, 72.2),
('BEY', 'Beirut Airport', 'Lebanon', 33.8208, 35.4883, 65.9),
('DOH', 'Hamad International Airport Information', 'Qatar', 25.2606, 51.6138, 69.9)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS airline (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    hub VARCHAR(3),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cash INTEGER NOT NULL,
    popularity REAL NOT NULL,
    CONSTRAINT fk_hub
      FOREIGN KEY(hub) 
	  REFERENCES airport(code)
);
INSERT INTO airline VALUES (1, 'My First Airline', 'LHR', now(), now(), 1000000, 100.0) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS purchased_route (
    id SERIAL PRIMARY KEY,
    airline_id INTEGER NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    popularity REAL NOT NULL,
    purchase_cost INTEGER NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE NULL,
    next_available_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_resulted_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE (airline_id, origin, destination),
    CONSTRAINT fk_airline_id FOREIGN KEY (airline_id) REFERENCES airline(id),
    CONSTRAINT fk_origin FOREIGN KEY (origin) REFERENCES airport(code),
    CONSTRAINT fk_destination FOREIGN KEY (destination) REFERENCES airport(code)
);
CREATE TABLE IF NOT EXISTS purchased_plane (
    id SERIAL PRIMARY KEY,
    airline_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    max_distance INTEGER NOT NULL,
    purchase_cost INTEGER NOT NULL,
    health INTEGER NOT NULL,
    route_id INTEGER NULL,
    CONSTRAINT fk_airline_id FOREIGN KEY (airline_id) REFERENCES airline(id),
    CONSTRAINT fk_route_id FOREIGN KEY (route_id) REFERENCES purchased_route(id)
);
COMMIT;