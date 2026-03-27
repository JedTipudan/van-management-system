import { useEffect, useRef, useState } from 'react';
import { vans, tracking } from '../../api/services';
import TrackingMap from '../../components/TrackingMap';
import useSocket from '../../hooks/useSocket';

const Tracking = () => {
  const [vanList, setVanList] = useState([]);
  const [locations, setLocations] = useState({});
  const locationsRef = useRef({});

  const socketRef = useSocket((socket) => {
    // Join tracking room on every (re)connect
    socket.emit('join:tracking');

    socket.off('location:update');
    socket.on('location:update', (data) => {
      locationsRef.current = { ...locationsRef.current, [data.van_id]: data };
      setLocations({ ...locationsRef.current });
    });
  });

  useEffect(() => {
    vans.getAll({ status: 'active' }).then((r) => {
      const raw = Array.isArray(r.data) ? r.data : (r.data.data || []);
      const list = [...new Map(raw.map((v) => [v.id, v])).values()];
      setVanList(list);
      // Load last known location for each van on mount
      list.forEach((v) => {
        tracking.getLocation(v.id)
          .then((res) => {
            locationsRef.current = { ...locationsRef.current, [v.id]: res.data };
            setLocations({ ...locationsRef.current });
          })
          .catch(() => {});
      });
    }).catch(() => {});
  }, []);

  const mapVans = vanList
    .filter((v) => locations[v.id])
    .map((v) => ({ van_id: v.id, plate_no: v.plate_no, ...locations[v.id] }));

  const activeCount = mapVans.length;

  return (
    <>
      <style>{`
        @keyframes ping {
          0%   { transform:scale(1); opacity:1; }
          75%  { transform:scale(2); opacity:0; }
          100% { transform:scale(2); opacity:0; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Live Tracking 📍</div>
          <div className="page-subtitle">
            {activeCount > 0
              ? `${activeCount} van${activeCount > 1 ? 's' : ''} broadcasting location`
              : 'Waiting for drivers to share their location...'}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ position:'relative', width:12, height:12 }}>
            <div style={{ width:12, height:12, borderRadius:'50%',
              background: activeCount > 0 ? '#10b981' : '#94a3b8' }} />
            {activeCount > 0 && (
              <div style={{ position:'absolute', inset:0, borderRadius:'50%',
                background:'#10b981', opacity:0.4,
                animation:'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
            )}
          </div>
          <span style={{ fontSize:'0.85rem', color:'var(--text-2)', fontWeight:500 }}>
            {activeCount > 0 ? 'Live' : 'No active vans'}
          </span>
        </div>
      </div>

      <TrackingMap vans={mapVans} />

      <div className="table-wrap" style={{ marginTop:'1.5rem' }}>
        <div className="card-header"><div className="card-title">🚐 Van Locations</div></div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Van</th><th>Status</th><th>Latitude</th><th>Longitude</th><th>Speed</th><th>Last Update</th></tr>
            </thead>
            <tbody>
              {vanList.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state"><div className="empty-state-icon">🚐</div>
                    <div className="empty-state-text">No active vans found</div></div>
                </td></tr>
              ) : vanList.map((v) => {
                const loc = locations[v.id];
                return (
                  <tr key={v.id}>
                    <td><strong>{v.plate_no}</strong><br /><small style={{ color:'var(--text-3)' }}>{v.model}</small></td>
                    <td>
                      <span className={`badge ${loc ? 'badge-active' : 'badge-inactive'}`}>
                        {loc ? '● Live' : '○ Offline'}
                      </span>
                    </td>
                    <td style={{ fontFamily:'monospace' }}>{loc ? Number(loc.lat).toFixed(6) : '—'}</td>
                    <td style={{ fontFamily:'monospace' }}>{loc ? Number(loc.lng).toFixed(6) : '—'}</td>
                    <td>{loc?.speed ? `${loc.speed} km/h` : '—'}</td>
                    <td>{loc?.timestamp ? new Date(loc.timestamp).toLocaleTimeString() : 'No data yet'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Tracking;
