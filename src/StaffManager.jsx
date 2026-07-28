import { useState, useEffect } from 'react';
import api from './api';

export default function StaffManager() {
  // שמירת רשימת אנשי הצוות
  const [staffList, setStaffList] = useState([]);

  // שמירת הנתונים שהמשתמש מקליד בטופס
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    role: 'מתמחה', // ערך ברירת מחדל
    phone: '',
    email: ''
  });

  // פונקציה לשליפת הנתונים מהשרת (FastAPI)
  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff/');
      setStaffList(response.data);
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    }
  };

  // useEffect דואג שהפונקציה תרוץ פעם אחת כשהדף נטען
  useEffect(() => {
    fetchStaff();
  }, []);

  // עדכון ה-state בכל פעם שמשנים שדה בטופס
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // שליחת הטופס לשרת ליצירת איש צוות חדש
  const handleSubmit = async (e) => {
    e.preventDefault(); // מונע מהדף להתרענן
    try {
      await api.post('/staff/', formData);
      alert('איש צוות נוסף בהצלחה!');
      fetchStaff(); // רענון הטבלה כדי לראות את איש הצוות החדש

      // איפוס הטופס
      setFormData({
        id: '', first_name: '', last_name: '', role: 'מתמחה', phone: '', email: ''
      });
    } catch (error) {
      alert('שגיאה בהוספת איש צוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Arial', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>ניהול אנשי צוות - חטיבת נשים</h2>

      {/* טופס הוספת איש צוות */}
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>הוספת איש צוות חדש</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
          <input type="text" name="id" placeholder="תעודת זהות" value={formData.id} onChange={handleChange} required />
          <input type="text" name="first_name" placeholder="שם פרטי" value={formData.first_name} onChange={handleChange} required />
          <input type="text" name="last_name" placeholder="שם משפחה" value={formData.last_name} onChange={handleChange} required />

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="מנהל">מנהל</option>
            <option value="מומחה">מומחה</option>
            <option value="מתמחה">מתמחה</option>
          </select>

          <input type="tel" name="phone" placeholder="טלפון" value={formData.phone} onChange={handleChange} />
          <input type="email" name="email" placeholder="דואר אלקטרוני" value={formData.email} onChange={handleChange} />

          <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            הוסף איש צוות
          </button>
        </form>
      </div>

      {/* טבלת אנשי צוות */}
      <h3>רשימת הצוות</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '8px' }}>ת.ז</th>
            <th style={{ padding: '8px' }}>שם מלא</th>
            <th style={{ padding: '8px' }}>תפקיד</th>
            <th style={{ padding: '8px' }}>טלפון</th>
            <th style={{ padding: '8px' }}>דוא"ל</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((staff) => (
            <tr key={staff.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>{staff.id}</td>
              <td style={{ padding: '8px' }}>{staff.first_name} {staff.last_name}</td>
              <td style={{ padding: '8px' }}>{staff.role}</td>
              <td style={{ padding: '8px' }}>{staff.phone}</td>
              <td style={{ padding: '8px' }}>{staff.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}