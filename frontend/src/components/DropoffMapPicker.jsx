import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DROP_ICON = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🔴</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

// Parse "lat, lng" string — returns {lat,lng} or null
const parseCoords = (text) => {
  const m = text.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (m) {
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }
  return null;
};

const DropoffMapPicker = ({ value, onChange }) => {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  // Place or move marker and pan map
  const placeMarker = (lat, lng, address) => {
    const map = instanceRef.current;
    if (!map) return;
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    else { markerRef.current = L.marker([lat, lng], { icon: DROP_ICON }).addTo(map); }
    map.setView([lat, lng], 15);
    onChange({ lat, lng, address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  };

  useEffect(() => {
    if (instanceRef.current) return;
    const map = L.map(mapRef.current).setView([14.5995, 120.9842], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map);
    map.on('click', ({ latlng: { lat, lng } }) => {
      placeMarker(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setSearch(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setSuggestions([]);
    });
    instanceRef.current = map;
  }, []);

  // If value passed in (edit mode), place marker on mount
  useEffect(() => {
    if (value?.lat && instanceRef.current && !markerRef.current) {
      placeMarker(value.lat, value.lng, value.address);
      setSearch(value.address || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSuggestions([]);
    clearTimeout(debounceRef.current);
    if (!val.trim()) return;

    // If it looks like coordinates, place immediately
    const coords = parseCoords(val);
    if (coords) {
      placeMarker(coords.lat, coords.lng, val.trim());
      return;
    }

    // Otherwise debounce Nominatim search
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 600);
  };

  const handleSuggestionClick = (s) => {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    placeMarker(lat, lng, s.display_name);
    setSearch(s.display_name);
    setSuggestions([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search address or paste coordinates e.g. 6.9366, 126.2522"
            style={{ flex: 1, fontSize: '0.85rem' }}
          />
          {searching && <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: 'var(--text-3)' }}>⏳</span>}
        </div>
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto',
          }}>
            {suggestions.map((s) => (
              <div key={s.place_id} onClick={() => handleSuggestionClick(s)}
                style={{ padding: '0.6rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                📍 {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
        Or tap anywhere on the map below to pin your drop-off
      </div>

      <div ref={mapRef} style={{ height: 240, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }} />

      {value?.lat && (
        <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
          🔴 Drop-off: {value.address}
        </div>
      )}
    </div>
  );
};

export default DropoffMapPicker;
