-- DROP TABLES IF THEY EXIST TO ENSURE A CLEAN INITIALIZATION
DROP TABLE IF EXISTS documents CASCADE;

DROP TABLE IF EXISTS expenses CASCADE;

DROP TABLE IF EXISTS maintenance_logs CASCADE;

DROP TABLE IF EXISTS fuel_logs CASCADE;

DROP TABLE IF EXISTS trips CASCADE;

DROP TABLE IF EXISTS drivers CASCADE;

DROP TABLE IF EXISTS vehicles CASCADE;

DROP TABLE IF EXISTS users CASCADE;
-- CREATE USERS TABLE
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN (
            'manager',
            'driver',
            'safety',
            'finance'
        )
    )
);
-- CREATE VEHICLES TABLE
CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity_max INTEGER NOT NULL,
    capacity_current INTEGER DEFAULT 0,
    fuel_level INTEGER DEFAULT 100 CHECK (
        fuel_level >= 0
        AND fuel_level <= 100
    ),
    status VARCHAR(50) DEFAULT 'available' CHECK (
        status IN (
            'available',
            'in-shop',
            'on-trip'
        )
    ),
    next_service VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL CHECK (
        fuel_type IN ('Electric', 'Diesel')
    )
);
-- CREATE DRIVERS TABLE
CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (
        status IN (
            'available',
            'on-trip',
            'suspended'
        )
    ),
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (
        rating >= 0
        AND rating <= 5
    ),
    hours_remaining NUMERIC(4, 1) DEFAULT 14.0 CHECK (
        hours_remaining >= 0
        AND hours_remaining <= 14
    ),
    avatar_color VARCHAR(255) NOT NULL
);
-- CREATE TRIPS TABLE
CREATE TABLE trips (
    id VARCHAR(50) PRIMARY KEY,
    source VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers (id) ON DELETE SET NULL,
    vehicle_id VARCHAR(50) REFERENCES vehicles (id) ON DELETE SET NULL,
    cargo VARCHAR(255) NOT NULL,
    weight INTEGER NOT NULL,
    progress NUMERIC(5, 2) DEFAULT 0.0 CHECK (
        progress >= 0
        AND progress <= 100
    ),
    speed INTEGER NOT NULL,
    completed_triggered BOOLEAN DEFAULT FALSE
);
-- CREATE FUEL LOGS TABLE
CREATE TABLE fuel_logs (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles (id) ON DELETE CASCADE,
    date VARCHAR(100) NOT NULL,
    amount_added VARCHAR(100) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    location VARCHAR(255) NOT NULL
);
-- CREATE MAINTENANCE LOGS TABLE
CREATE TABLE maintenance_logs (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) REFERENCES vehicles (id) ON DELETE CASCADE,
    date VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (
        status IN (
            'Completed',
            'In-Shop',
            'Scheduled'
        )
    )
);
-- CREATE EXPENSES TABLE
CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date VARCHAR(100) NOT NULL,
    vehicle_id VARCHAR(50) REFERENCES vehicles (id) ON DELETE SET NULL
);
-- CREATE DOCUMENTS TABLE
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    upload_date VARCHAR(100) NOT NULL,
    driver_id VARCHAR(50) REFERENCES drivers (id) ON DELETE SET NULL,
    vehicle_id VARCHAR(50) REFERENCES vehicles (id) ON DELETE SET NULL
);
-- SEED INITIAL VEHICLES
INSERT INTO
    vehicles (
        id,
        name,
        type,
        capacity_max,
        capacity_current,
        fuel_level,
        status,
        next_service,
        fuel_type
    )
VALUES (
        'V-101',
        'Tesla Semi Alpha',
        'Electric Heavy Duty',
        20000,
        0,
        88,
        'available',
        'Aug 12',
        'Electric'
    ),
    (
        'V-102',
        'Rivian Cargo Van',
        'Electric Delivery',
        5000,
        4400,
        42,
        'on-trip',
        'Sep 01',
        'Electric'
    ),
    (
        'V-103',
        'Mack Anthem Heavy',
        'Class 8 Diesel Tractor',
        30000,
        0,
        94,
        'available',
        'Jul 28',
        'Diesel'
    ),
    (
        'V-104',
        'Ford E-Transit',
        'Light Delivery Van',
        2000,
        0,
        15,
        'in-shop',
        'Scheduled Today',
        'Electric'
    ),
    (
        'V-105',
        'Freightliner eCascadia',
        'Class 8 Electric Semi',
        25000,
        0,
        72,
        'available',
        'Aug 05',
        'Electric'
    ),
    (
        'V-106',
        'Peterbilt 579 EV',
        'Class 8 Electric Semi',
        25000,
        8000,
        56,
        'on-trip',
        'Jul 30',
        'Electric'
    );
-- SEED INITIAL DRIVERS
INSERT INTO
    drivers (
        id,
        name,
        license_type,
        status,
        rating,
        hours_remaining,
        avatar_color
    )
VALUES (
        'D-201',
        'Alex Chen',
        'CDL Class A',
        'available',
        4.90,
        12.5,
        'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
    ),
    (
        'D-202',
        'Sarah Jenkins',
        'CDL Class A',
        'on-trip',
        4.80,
        4.0,
        'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
    ),
    (
        'D-203',
        'Marcus Vance',
        'CDL Class B (Suspended)',
        'suspended',
        3.20,
        0.0,
        'bg-red-500/30 text-red-200 border-red-400/50'
    ),
    (
        'D-204',
        'Elena Rostova',
        'CDL Class A',
        'available',
        4.95,
        13.8,
        'bg-indigo-500/30 text-indigo-200 border-indigo-400/50'
    ),
    (
        'D-205',
        'David Kim',
        'CDL Class A',
        'on-trip',
        4.70,
        8.2,
        'bg-amber-500/30 text-amber-200 border-amber-400/50'
    );
-- SEED INITIAL TRIPS
INSERT INTO
    trips (
        id,
        source,
        destination,
        driver_id,
        vehicle_id,
        cargo,
        weight,
        progress,
        speed
    )
VALUES (
        'TRIP-301',
        'LAX',
        'SEA',
        'D-202',
        'V-102',
        'Microchips & Batteries',
        4400,
        45.00,
        64
    ),
    (
        'TRIP-302',
        'DFW',
        'ATL',
        'D-205',
        'V-106',
        'Aerospace Components',
        8000,
        72.00,
        58
    );
-- SEED INITIAL FUEL LOGS
INSERT INTO
    fuel_logs (
        id,
        vehicle_id,
        date,
        amount_added,
        cost,
        location
    )
VALUES (
        'F-501',
        'V-101',
        'Jul 11, 08:30',
        '150 kWh (Megacharge)',
        45.00,
        'LA Super-hub'
    ),
    (
        'F-502',
        'V-103',
        'Jul 10, 14:15',
        '120 Gal (Ultra Diesel)',
        492.00,
        'Dallas Travel Oasis'
    ),
    (
        'F-503',
        'V-102',
        'Jul 10, 19:40',
        '65 kWh (Fastcharge)',
        21.45,
        'SF Central Depot'
    ),
    (
        'F-504',
        'V-105',
        'Jul 09, 11:10',
        '180 kWh (Megacharge)',
        54.00,
        'Chicago Terminal East'
    );
-- SEED INITIAL MAINTENANCE LOGS
INSERT INTO
    maintenance_logs (
        id,
        vehicle_id,
        date,
        description,
        cost,
        status
    )
VALUES (
        'M-601',
        'V-104',
        'Scheduled Today',
        'Brake Rotor Calibration & Battery Diagnostics',
        1250.00,
        'In-Shop'
    ),
    (
        'M-602',
        'V-103',
        'Jul 09',
        'Class-8 Engine Lubricant & Air Filter Exchange',
        480.00,
        'Completed'
    ),
    (
        'M-603',
        'V-101',
        'Jul 08',
        'Cabin Thermal Management Inspection',
        310.00,
        'Completed'
    ),
    (
        'M-604',
        'V-105',
        'Jul 15 (Scheduled)',
        'HV Cable Insulation Wear Assessment',
        850.00,
        'Scheduled'
    );
-- SEED INITIAL EXPENSES
INSERT INTO
    expenses (
        id,
        description,
        amount,
        category,
        date,
        vehicle_id
    )
VALUES (
        'EXP-701',
        'Toll fee - Interstate 5',
        45.50,
        'Toll',
        'Jul 11, 09:30',
        'V-102'
    ),
    (
        'EXP-702',
        'Permit fee - Cargo authorization',
        120.00,
        'Permit',
        'Jul 10, 11:45',
        'V-106'
    ),
    (
        'EXP-703',
        'Driver meal allowance',
        35.00,
        'Meal',
        'Jul 11, 13:00',
        'V-102'
    );
-- SEED INITIAL DOCUMENTS
INSERT INTO
    documents (
        id,
        title,
        type,
        url,
        upload_date,
        driver_id,
        vehicle_id
    )
VALUES (
        'DOC-801',
        'Commercial Driver License (CDL)',
        'License',
        'https://example.com/docs/cdl_alex.pdf',
        'Jul 01, 10:00',
        'D-201',
        NULL
    ),
    (
        'DOC-802',
        'Vehicle Registration',
        'Registration',
        'https://example.com/docs/reg_v101.pdf',
        'Jul 02, 14:30',
        NULL,
        'V-101'
    ),
    (
        'DOC-803',
        'Cargo Manifest TRIP-301',
        'Manifest',
        'https://example.com/docs/manifest_301.pdf',
        'Jul 11, 08:00',
        'D-202',
        'V-102'
    );