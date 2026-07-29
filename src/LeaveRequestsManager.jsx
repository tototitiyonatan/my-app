import { useState, useEffect } from 'react';
import api from './api';

export default function LeaveRequestsManager({ user }) {
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    staff_id: user.role === 'guest' ? user.id : '',
    start_date: today,
    end_date: today,
    status_type: 'חופשה',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, staffRes] = await Promise.all([
        api.get('/leave-requests/'),
        api.get('/staff/')
      ]);

      setStaffList(staffRes.data);

      if (user.role === 'guest') {
        setRequests(reqRes.data.filter(r => r.staff_id === user.id));
        setFormData(prev => ({ ...prev, staff_id: user.id }));
      } else {
        setRequests(reqRes.data);
        if (staffRes.data.length > 0) {
          setFormData(prev => ({ ...prev, staff_id: staffRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('שגיאה בשליפת נתונים', err);
    }
  };

  const getStaffName = (id) => {
    const person = staffList.find(s => s.id === id);
    return person ? person.last_name : id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave-requests/', formData);
      alert('הבקשה הוגשה בהצלחה למנהל!');
      fetchData();
      setFormData(prev => ({ ...prev, start_date: today, end_date: today, notes: '' }));
    } catch (err) {
      alert('שגיאה בהגשת הבקשה');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/leave-requests/${id}?action=${action}`);
      alert('הסטטוס עודכן, ואם אושר - הוכנס אוטומטית ליומן ההיעדרויות!');
      fetchData();
    } catch (err) {
      alert('שגיאה בעדכון הבקשה');
    }
  };

  const statusBadge = (status) => {
    if (status === 'אושר') return 'badge-success';
    if (status === 'נדחה') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div>
      <h2 className="section-title">
        {user.role === 'admin' ? 'ניהול בקשות חופשה והיעדרות' : 'הגשת בקשת היעדרות / חופשה'}
      </h2>

      <div className="card section-spacing">
        <h3>הגש בקשה חדשה</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {user.role === 'admin' && (
            <div className="form-group full-width">
              <label className="form-label">בחר איש צוות</label>
              <select
                className="form-select"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
              >
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.last_name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">סוג היעדרות</label>
            <select
              className="form-select"
              value={formData.status_type}
              onChange={(e) => setFormData({ ...formData, status_type: e.target.value })}
            >
              <option value="חופשה">חופשה</option>
              <option value="חופשת לידה">חופשת לידה</option>
              <option value="השתלמות">השתלמות</option>
              <option value="אחרי תורנות">אחרי תורנות</option>
              <option value="מחלה">מחלה</option>
              <option value="מחלת ילד">מחלת ילד</option>
              <option value="יום בחירה">יום בחירה</option>
              <option value="א.ס">א.ס (אישור ספציפי)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">מתאריך</label>
            <input
              type="date"
              className="form-input"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">עד תאריך</label>
            <input
              type="date"
              className="form-input"
              value={formData.end_date}
              min={formData.start_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">הערות (סיבת הבקשה)</label>
            <input
              type="text"
              className="form-input"
              placeholder="פירוט נוסף..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <button type="submit" className="btn btn-primary">
              {user.role === 'admin' ? 'הוסף בקשה למערכת' : 'שלח בקשה לאישור המנהל'}
            </button>
          </div>
        </form>
      </div>

      <h3>{user.role === 'admin' ? 'כל הבקשות במערכת' : 'הבקשות שלי'}</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {user.role === 'admin' && <th>שם איש הצוות</th>}
              <th>סוג</th>
              <th>מתאריך</th>
              <th>עד תאריך</th>
              <th>הערות</th>
              <th>סטטוס</th>
              {user.role === 'admin' && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                {user.role === 'admin' && <td><strong>{getStaffName(req.staff_id)}</strong></td>}
                <td><span className="badge badge-danger">{req.status_type}</span></td>
                <td>{req.start_date}</td>
                <td>{req.end_date}</td>
                <td>{req.notes}</td>
                <td><span className={`badge ${statusBadge(req.status)}`}>{req.status}</span></td>
                {user.role === 'admin' && (
                  <td>
                    {req.status === 'ממתין לאישור' && (
                      <div className="action-row">
                        <button onClick={() => handleAction(req.id, 'approve')} className="btn btn-success btn-sm">אשר</button>
                        <button onClick={() => handleAction(req.id, 'reject')} className="btn btn-danger btn-sm">דחה</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
