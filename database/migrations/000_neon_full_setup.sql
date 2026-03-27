-- ============================================================
-- VAN MANAGEMENT SYSTEM - FULL DATABASE SETUP
-- Paste this entire file into Neon SQL Editor and run it
-- ============================================================

-- 001: Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE van_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty');
CREATE TYPE trip_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'card');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_no VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  status driver_status DEFAULT 'available',
  rating DECIMAL(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_no VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  capacity INTEGER NOT NULL,
  status van_status DEFAULT 'active',
  year INTEGER,
  last_maintenance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  van_id UUID NOT NULL REFERENCES vans(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost DECIMAL(10,2),
  maintenance_date DATE NOT NULL,
  next_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  distance_km DECIMAL(8,2),
  estimated_minutes INTEGER,
  fare DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(150) NOT NULL,
  stop_order INTEGER NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8)
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  van_id UUID NOT NULL REFERENCES vans(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  departure_time TIMESTAMPTZ NOT NULL,
  recurrence VARCHAR(20) DEFAULT 'once',
  days_of_week INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  status trip_status DEFAULT 'scheduled',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  user_id UUID NOT NULL REFERENCES users(id),
  seat_no INTEGER,
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  status booking_status DEFAULT 'pending',
  pax INTEGER NOT NULL DEFAULT 1,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  pickup_address TEXT,
  dropoff_lat DECIMAL(10,8),
  dropoff_lng DECIMAL(11,8),
  dropoff_address TEXT,
  driver_marked_paid BOOLEAN DEFAULT false,
  cancel_requested BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_ref VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gps_logs (
  id BIGSERIAL PRIMARY KEY,
  van_id UUID NOT NULL REFERENCES vans(id),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drive_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id),
  requested_departure TIMESTAMPTZ NOT NULL,
  note TEXT,
  status request_status DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gps_logs_van_time ON gps_logs(van_id, timestamp DESC);
CREATE INDEX idx_trips_schedule ON trips(schedule_id);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_schedules_van ON schedules(van_id);
CREATE INDEX idx_schedules_driver ON schedules(driver_id);
CREATE INDEX idx_drive_requests_driver ON drive_requests(driver_id);
CREATE INDEX idx_drive_requests_status ON drive_requests(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vans_updated BEFORE UPDATE ON vans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 002: Seed Data
-- Admin password: Admin@123
-- Driver password: Admin@123
-- Customer password: Admin@123
-- ============================================================

INSERT INTO users (id, name, email, password, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@vanms.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+639001234567'),
  ('00000000-0000-0000-0000-000000000002', 'Juan Dela Cruz', 'driver1@vanms.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', '+639001234568'),
  ('00000000-0000-0000-0000-000000000003', 'Maria Santos', 'customer1@vanms.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+639001234569');

INSERT INTO drivers (user_id, license_no, license_expiry, status) VALUES
  ('00000000-0000-0000-0000-000000000002', 'N01-23-456789', '2026-12-31', 'available');

INSERT INTO vans (plate_no, model, capacity, status, year) VALUES
  ('ABC-1234', 'Toyota HiAce', 15, 'active', 2022),
  ('XYZ-5678', 'Nissan Urvan', 18, 'active', 2021),
  ('DEF-9012', 'Hyundai H350', 12, 'maintenance', 2020);

INSERT INTO routes (name, origin, destination, distance_km, estimated_minutes, fare) VALUES
  ('Route 1 - North', 'Cubao, QC', 'Fairview, QC', 12.5, 45, 35.00),
  ('Route 2 - South', 'Cubao, QC', 'Alabang, Muntinlupa', 28.0, 90, 75.00),
  ('Route 3 - East', 'Cubao, QC', 'Antipolo, Rizal', 18.0, 60, 50.00);
