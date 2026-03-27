import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const vanIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#6366f1;color:#fff;border-radius:50%;
    width:36px;height:36px;display:flex;align-items:center;
    justify-content:center;font-size:18px;
    box-shadow:0 2px 8px rgba(99,102,241,0.5);
    border:3px solid #fff;">🚐</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// vans: [{ van_id, plate_no, lat, lng, speed, heading }]
const TrackingMap = ({ vans = [], center = [14.5995, 120.9842], zoom = 12 }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    vans.forEach(({ van_id, plate_no, lat, lng, speed }) => {
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      if (isNaN(latF) || isNaN(lngF)) return;
      const pos = [latF, lngF];
      const popup = `
        <div style="font-family:Inter,sans-serif;min-width:140px">
          <div style="font-weight:700;font-size:1rem;margin-bottom:4px">🚐 ${plate_no}</div>
          <div style="color:#475569;font-size:0.8rem">Speed: <b>${speed || 0} km/h</b></div>
          <div style="color:#475569;font-size:0.75rem;margin-top:2px">${latF.toFixed(5)}, ${lngF.toFixed(5)}</div>
        </div>`;

      if (markersRef.current[van_id]) {
        markersRef.current[van_id].setLatLng(pos).setPopupContent(popup);
      } else {
        markersRef.current[van_id] = L.marker(pos, { icon: vanIcon })
          .addTo(map)
          .bindPopup(popup);
        // Auto-pan to first van
        if (Object.keys(markersRef.current).length === 1) {
          map.setView(pos, 15);
        }
      }
    });

    // Remove markers for vans no longer in list
    const activeIds = vans.map((v) => v.van_id);
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.includes(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [vans]);

  return (
    <div ref={mapRef} style={{
      height: '460px', width: '100%',
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
    }} />
  );
};

export default TrackingMap;
