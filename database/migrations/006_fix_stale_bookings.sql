-- Fix stale confirmed bookings: mark them completed if their trip is completed
UPDATE bookings
SET status = 'completed'
WHERE status = 'confirmed'
  AND trip_id IN (SELECT id FROM trips WHERE status = 'completed');
