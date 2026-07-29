import { useState, useEffect } from 'react';
import api from './api';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/dashboard/stats?target_date=${targetDate}`);
        setStats(response.data);
      } catch (error) {
        console.error('שגיאה בשליפת נתוני דאשבורד:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [targetDate]);

  return (
    <div>
      <div className="page-header">
        <h2 className="section-title">תמונת מצב יומית</h2>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0 }}>בחר תאריך:</label>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>טוען נתונים...</span>
        </div>
      ) : stats ? (
        <div className="stat-grid">
          <div className="stat-card success">
            <div className="stat-card-label">נוכחים</div>
            <div className="stat-card-value">{stats.present}</div>
            <div className="stat-card-detail">
              מומחים: {stats.present_breakdown['מומחה'] || 0} ·
              מתמחים: {stats.present_breakdown['מתמחה'] || 0}
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-card-label">נעדרים</div>
            <div className="stat-card-value">{stats.absent}</div>
            {Object.keys(stats.absent_breakdown).length === 0 ? (
              <div className="stat-card-detail">אין היעדרויות היום.</div>
            ) : (
              <ul className="stat-list">
                {Object.entries(stats.absent_breakdown).map(([status, data]) => (
                  <li key={status}>
                    <strong>{status}: {data.total}</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      מומחים: {data.breakdown['מומחה'] || 0} ·
                      מתמחים: {data.breakdown['מתמחה'] || 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">לא נמצאו נתונים.</div>
      )}
    </div>
  );
}
