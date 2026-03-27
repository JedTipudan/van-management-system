import { useEffect, useState } from 'react';
import { bookings } from '../api/services';

// selectedSeats: array of seat numbers
// onSelect: (seats[]) => void
const SeatMap = ({ tripId, selectedSeats = [], onSelect, pax = 1 }) => {
  const [data, setData] = useState({ seats: [], capacity: 0 });

  useEffect(() => {
    if (!tripId) return;
    bookings.seatMap(tripId).then((r) => setData(r.data)).catch(() => {});
  }, [tripId]);

  const occupiedMap = {};
  data.seats.forEach((s) => { occupiedMap[s.seat_no] = s; });

  const handleClick = (num) => {
    const isSelected = selectedSeats.includes(num);
    if (isSelected) {
      // Deselect
      onSelect(selectedSeats.filter((s) => s !== num));
    } else {
      if (selectedSeats.length >= pax) {
        // Already have enough — replace oldest selection
        onSelect([...selectedSeats.slice(1), num]);
      } else {
        onSelect([...selectedSeats, num]);
      }
    }
  };

  const needed = pax - selectedSeats.length;
  const isComplete = selectedSeats.length === pax;

  return (
    <div>
      {/* Status indicator */}
      <div style={{
        marginBottom: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: 8,
        background: isComplete ? '#dcfce7' : needed > 0 ? '#fef9c3' : '#f8fafc',
        border: `1.5px solid ${isComplete ? '#86efac' : needed > 0 ? '#fde68a' : 'var(--border)'}`,
        fontSize: '0.82rem', fontWeight: 600,
        color: isComplete ? '#15803d' : '#a16207',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        transition: 'all 0.2s',
      }}>
        {isComplete
          ? `✅ ${pax} seat${pax > 1 ? 's' : ''} selected — you're all set!`
          : pax === 1
            ? '🪑 Select your seat below (optional — skip to get any available seat)'
            : needed === pax
              ? `🪑 Please select ${pax} seats for your group`
              : `⚠️ Select ${needed} more seat${needed > 1 ? 's' : ''} — ${selectedSeats.length} of ${pax} chosen`}
      </div>

      {/* Legend */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: '0.65rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
        {[
          { bg: '#dcfce7', border: '#86efac', label: 'Available' },
          { bg: '#fee2e2', border: '#fca5a5', label: 'Occupied' },
          { bg: '#6366f1', border: '#4f46e5', label: 'Selected', color: '#fff' },
        ].map(({ bg, border, label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, background: bg, border: `1.5px solid ${border}`, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-2)' }}>{label}</span>
          </span>
        ))}
      </div>

      {data.capacity === 0 ? (
        <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', padding: '1rem 0' }}>Loading seat map...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', maxWidth: 230 }}>
          {/* Driver */}
          <div style={{ gridColumn: '1', background: '#1e1b4b', borderRadius: 6, padding: '0.4rem', textAlign: 'center', fontSize: '0.6rem', color: '#a5b4fc', fontWeight: 600 }}>
            🚐<br />Driver
          </div>
          <div style={{ gridColumn: '2 / 5' }} />

          {Array.from({ length: data.capacity }, (_, i) => i + 1).map((num) => {
            const occ = occupiedMap[num];
            const isSelected = selectedSeats.includes(num);
            const isOccupied = !!occ;
            const selIndex = selectedSeats.indexOf(num);

            let bg = '#dcfce7', border = '1.5px solid #86efac', color = '#166534';
            if (isOccupied) { bg = '#fee2e2'; border = '1.5px solid #fca5a5'; color = '#991b1b'; }
            if (isSelected) { bg = '#6366f1'; border = '1.5px solid #4f46e5'; color = '#fff'; }

            return (
              <div key={num}
                onClick={() => !isOccupied && handleClick(num)}
                title={occ ? `Occupied by ${occ.name}` : isSelected ? `Seat ${num} — Selected` : `Seat ${num} — Available`}
                style={{
                  background: bg, border, borderRadius: 6,
                  padding: '0.4rem 0.2rem', textAlign: 'center',
                  fontSize: '0.72rem', fontWeight: 700, color,
                  cursor: isOccupied ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isSelected ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                  position: 'relative',
                }}
              >
                {num}
                {isSelected && (
                  <div style={{ fontSize: '0.55rem', marginTop: 1 }}>
                    #{selIndex + 1}
                  </div>
                )}
                {isOccupied && (
                  <div style={{ fontSize: '0.52rem', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {occ.name?.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 600 }}>Selected:</span>
          {selectedSeats.map((s) => (
            <span key={s} style={{ background: '#6366f1', color: '#fff', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
              Seat {s}
            </span>
          ))}
          <button type="button" onClick={() => onSelect([])}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default SeatMap;
