import { useState, useEffect } from 'react';
import api from './api';

export default function Dashboard() {
  // קביעת התאריך של היום כברירת מחדל
  const today = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState(today);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // פנייה לנקודת הקצה שיצרנו ב-FastAPI
        const response = await api.get(`/dashboard/stats?target_date=${targetDate}`);
        setStats(response.data);
      } catch (error) {
        console.error('שגיאה בשליפת נתוני דאשבורד:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [targetDate]); // ה-useEffect ירוץ מחדש בכל פעם שהתאריך משתנה

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>תמונת מצב יומית</h2>
        <div>
          <label style={{ fontWeight: 'bold', marginLeft: '10px' }}>בחר תאריך:</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {loading ? (
        <p>טוען נתונים...</p>
      ) : stats ? (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          {/* כרטיסיית נוכחים */}
          <div style={{ flex: '1 1 300px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '10px', backgroundColor: '#e8f5e9' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
              נוכחים היום במחלקה: {stats.present}
            </h3>
            <p style={{ margin: 0, fontSize: '15px' }}>
              (מנהלים: {stats.present_breakdown['מנהל'] || 0}, מומחים: {stats.present_breakdown['מומחה'] || 0}, מתמחים: {stats.present_breakdown['מתמחה'] || 0})
            </p>
          </div>

          {/* כרטיסיית נעדרים */}
          <div style={{ flex: '1 1 300px', padding: '20px', border: '2px solid #F44336', borderRadius: '10px', backgroundColor: '#ffebee' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c62828' }}>
              לא נמצאים היום: {stats.absent}
            </h3>

            {/* פירוט ההיעדרויות */}
            {Object.keys(stats.absent_breakdown).length === 0 ? (
              <p style={{ margin: 0 }}>אין היעדרויות היום.</p>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyleType: 'none', lineHeight: '1.8' }}>
                {Object.entries(stats.absent_breakdown).map(([status, data]) => (
                  <li key={status} style={{ borderBottom: '1px solid #ffcdd2', paddingBottom: '5px', marginBottom: '5px' }}>
                    <strong>{status}: {data.total}</strong>
                    <span style={{ fontSize: '14px', marginRight: '8px' }}>
                      (מנהלים: {data.breakdown['מנהל'] || 0} | מומחים: {data.breakdown['מומחה'] || 0} | מתמחים: {data.breakdown['מתמחה'] || 0})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      ) : (
        <p>לא נמצאו נתונים.</p>
      )}
    </div>
  );
}