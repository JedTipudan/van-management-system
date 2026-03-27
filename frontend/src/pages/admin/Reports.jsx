import { useEffect, useState } from 'react';
import { reports } from '../../api/services';

const Reports = () => {
  const [revenue, setRevenue] = useState([]);
  const [tripReport, setTripReport] = useState([]);

  useEffect(() => {
    reports.revenue().then((r) => setRevenue(r.data));
    reports.trips().then((r) => setTripReport(r.data));
  }, []);

  const totalRevenue = revenue.reduce((s, r) => s + Number(r.total), 0);
  const totalBookings = revenue.reduce((s, r) => s + Number(r.bookings), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-subtitle">Last 30 days performance overview</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}>💰</div>
          <div className="stat-value" style={{ color: '#10b981', fontSize: '1.3rem' }}>₱{totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>🎫</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="table-wrap">
          <div className="card-header"><div className="card-title">📅 Daily Revenue</div></div>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Date</th><th>Bookings</th><th>Revenue</th></tr></thead>
              <tbody>
                {revenue.length === 0 ? (
                  <tr><td colSpan={3}><div className="empty-state"><div className="empty-state-text">No revenue data</div></div></td></tr>
                ) : revenue.map((r) => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td>{r.bookings}</td>
                    <td><strong style={{ color: 'var(--success)' }}>₱{Number(r.total).toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-wrap">
          <div className="card-header"><div className="card-title">🗺️ Trips by Route</div></div>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Route</th><th>Trips</th><th>Bookings</th><th>Revenue</th></tr></thead>
              <tbody>
                {tripReport.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-text">No trip data</div></div></td></tr>
                ) : tripReport.map((r) => (
                  <tr key={r.route}>
                    <td><strong>{r.route}</strong></td>
                    <td>{r.trips}</td>
                    <td>{r.bookings}</td>
                    <td><strong style={{ color: 'var(--success)' }}>₱{Number(r.revenue || 0).toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
