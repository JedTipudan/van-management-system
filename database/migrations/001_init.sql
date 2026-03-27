-- Van Management System - Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'driver', 'customer');
CREATE TYPE van_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty');
CREATE TYPE trip_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'card');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

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
  recurrence VARCHAR(20) DEFAULT 'once', -- once, daily, weekly
  days_of_week INTEGER[], -- 0=Sun, 1=Mon, ...
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

-- Indexes for performance
CREATE INDEX idx_gps_logs_van_time ON gps_logs(van_id, timestamp DESC);
CREATE INDEX idx_trips_schedule ON trips(schedule_id);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_schedules_van ON schedules(van_id);
CREATE INDEX idx_schedules_driver ON schedules(driver_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vans_updated BEFORE UPDATE ON vans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
