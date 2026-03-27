-- Seed Data for Development

-- Admin user (password: Admin@123)
INSERT INTO users (id, name, email, password, role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'System Admin', 'admin@vanms.com',
   '$2b$10$rQZ9uAVn8MqXqXqXqXqXqOeKkKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'admin', '+639001234567'),
  ('00000000-0000-0000-0000-000000000002', 'Juan Dela Cruz', 'driver1@vanms.com',
   '$2b$10$rQZ9uAVn8MqXqXqXqXqXqOeKkKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'driver', '+639001234568'),
  ('00000000-0000-0000-0000-000000000003', 'Maria Santos', 'customer1@vanms.com',
   '$2b$10$rQZ9uAVn8MqXqXqXqXqXqOeKkKkKkKkKkKkKkKkKkKkKkKkKkKkK', 'customer', '+639001234569');

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
