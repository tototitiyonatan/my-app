import { useState, useEffect } from 'react';
import axios from 'axios';

export default function LeaveRequestsManager({ user }) {
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]); // חדש: שמירת רשימת הצוות לשם השליפה
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
      // שליפת גם הבקשות וגם רשימת אנשי הצוות במקביל
      const [reqRes, staffRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/leave-requests/'),
        axios.get('http://127.0.0.1:8000/staff/')
      ]);

      setStaffList(staffRes.data);

      // אם זה אורח, נציג רק את הבקשות שלו
      if (user.role === 'guest') {
        setRequests(reqRes.data.filter(r => r.staff_id === user.id));
        // הגדרת ת.ז ברירת מחדל בטופס של האורח
        setFormData(prev => ({ ...prev, staff_id: user.id }));
      } else {
        setRequests(reqRes.data);
        // למנהל נגדיר ברירת מחדל של איש הצוות הראשון ברשימה אם קיים
        if (staffRes.data.length > 0) {
          setFormData(prev => ({ ...prev, staff_id: staffRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('שגיאה בשליפת נתונים', err);
    }
  };

  // פונקציית עזר להמרת תעודת זהות לשם מלא
  const getStaffName = (id) => {
    const person = staffList.find(s => s.id === id);
    return person ? `${person.first_name} ${person.last_name}` : id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/leave-requests/', formData);
      alert('הבקשה הוגשה בהצלחה למנהל!');
      fetchData();
      setFormData(prev => ({
        ...prev,
        start_date: today,
        end_date: today,
        notes: ''
      }));
    } catch (err) {
      alert('שגיאה בהגשת הבקשה');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`http://127.0.0.1:8000/leave-requests/${id}?action=${action}`);
      alert('הסטטוס עודכן, ואם אושר - הוכנס אוטומטית ליומן ההיעדרויות!');
      fetchData();
    } catch (err) {
      alert('שגיאה בעדכון הבקשה');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>{user.role === 'admin' ? 'ניהול בקשות חופשה והיעדרות של הצוות' : 'הגשת בקשת היעדרות / חופשה'}</h2>

      {/* טופס הגשת בקשה */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#f9f9f9' }}>
        <h3>הגש בקשה חדשה</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

          {/* אם זה מנהל, ניתן לו אפשרות לבחור איזה איש צוות עבורו הוא מגיש (או לעצמו) */}
          {user.role === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
              <label>בחר איש צוות:</label>
              <select
                value={formData.staff_id}
                onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                style={{ padding: '8px' }}
                required
              >
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>סוג היעדרות:</label>
            <select
              value={formData.status_type}
              onChange={(e) => setFormData({...formData, status_type: e.target.value})}
              style={{ padding: '8px' }}
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

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>מתאריך:</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
              style={{ padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>עד תאריך:</label>
            <input
              type="date"
              value={formData.end_date}
              min={formData.start_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              required
              style={{ padding: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
            <label>הערות (סיבת הבקשה):</label>
            <input
              type="text"
              placeholder="פירוט נוסף..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={{ padding: '8px' }}
            />
          </div>

          <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            {user.role === 'admin' ? 'הוסף בקשה למערכת' : 'שלח בקשה לאישור המנהל'}
          </button>
        </form>
      </div>

      {/* טבלת הבקשות */}
      <h3>{user.role === 'admin' ? 'כל הבקשות במערכת' : 'הבקשות שלי'}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: '#eee', borderBottom: '2px solid #ccc' }}>
            {user.role === 'admin' && <th style={{ padding: '10px' }}>שם איש הצוות</th>}
            <th style={{ padding: '10px' }}>סוג</th>
            <th style={{ padding: '10px' }}>מתאריך</th>
            <th style={{ padding: '10px' }}>עד תאריך</th>
            <th style={{ padding: '10px' }}>הערות</th>
            <th style={{ padding: '10px' }}>סטטוס</th>
            {user.role === 'admin' && <th style={{ padding: '10px' }}>פעולות ניהול</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} style={{ borderBottom: '1px solid #ddd' }}>
              {user.role === 'admin' && <td style={{ padding: '10px', fontWeight: 'bold' }}>{getStaffName(req.staff_id)}</td>}
              <td style={{ padding: '10px', color: '#d32f2f' }}>{req.status_type}</td>
              <td style={{ padding: '10px' }}>{req.start_date}</td>
              <td style={{ padding: '10px' }}>{req.end_date}</td>
              <td style={{ padding: '10px' }}>{req.notes}</td>
              <td style={{ padding: '10px', fontWeight: 'bold', color: req.status === 'אושר' ? 'green' : req.status === 'נדחה' ? 'red' : 'orange' }}>
                {req.status}
              </td>
              {user.role === 'admin' && (
                <td style={{ padding: '10px' }}>
                  {req.status === 'ממתין לאישור' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleAction(req.id, 'approve')} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>אשר</button>
                      <button onClick={() => handleAction(req.id, 'reject')} style={{ background: '#F44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>דחה</button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}