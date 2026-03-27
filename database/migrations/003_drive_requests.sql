-- Drive Requests: drivers can request to drive a route, admin approves/rejects

CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

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

CREATE INDEX idx_drive_requests_driver ON drive_requests(driver_id);
CREATE INDEX idx_drive_requests_status ON drive_requests(status);
