import { useState, useEffect } from 'react';
import api from './api';

export default function StaffManager() {
  const [staffList, setStaffList] = useState([]);

  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    role: 'מתמחה',
    phone: '',
    email: ''
  });

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff/');
      setStaffList(response.data);
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/', formData);
      alert('איש צוות נוסף בהצלחה!');
      fetchStaff();
      setFormData({
        id: '', first_name: '', last_name: '', role: 'מתמחה', phone: '', email: ''
      });
    } catch (error) {
      alert('שגיאה בהוספת איש צוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק איש צוות זה?')) return;
    try {
      await api.delete(`/staff/${id}`);
      alert('איש צוות נמחק בהצלחה');
      fetchStaff();
    } catch (error) {
      alert('שגיאה במחיקת איש צוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Arial', padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>ניהול אנשי צוות - חטיבת נשים</h2>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>הוספת איש צוות חדש</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }} id="staff-form">
          <input type="text" name="id" placeholder="תעודת זהות" value={formData.id} onChange={handleChange} required style={{ padding: '8px' }} />
          <input type="text" name="first_name" placeholder="שם פרטי" value={formData.first_name} onChange={handleChange} required style={{ padding: '8px' }} />
          <input type="text" name="last_name" placeholder="שם משפחה" value={formData.last_name} onChange={handleChange} required style={{ padding: '8px' }} />

          <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '8px' }}>
            <option value="מנהל">מנהל</option>
            <option value="מומחה">מומחה</option>
            <option value="מתמחה">מתמחה</option>
          </select>

          <input type="tel" name="phone" placeholder="טלפון" value={formData.phone} onChange={handleChange} style={{ padding: '8px' }} />
          <input type="email" name="email" placeholder="דואר אלקטרוני" value={formData.email} onChange={handleChange} style={{ padding: '8px' }} />

          <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            הוסף איש צוות
          </button>
        </form>
      </div>

      <h3>רשימת הצוות</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '600px' }} id="staff-table">
          <thead>
            <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>ת.ז</th>
              <th style={{ padding: '8px' }}>שם מלא</th>
              <th style={{ padding: '8px' }}>תפקיד</th>
              <th style={{ padding: '8px' }}>טלפון</th>
              <th style={{ padding: '8px' }}>דוא"ל</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>פעולות</th>
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
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(staff.id)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    title="הסר איש צוות"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        @media (max-width: 600px) {
          #staff-form {
            grid-template-columns: 1fr; /* Stack form elements vertically */
          }
          #staff-form input, #staff-form select, #staff-form button {
            width: 100%;
            box-sizing: border-box; /* Include padding in width calculation */
          }
          #staff-table th, #staff-table td {
            padding: 8px 5px; /* Reduce padding */
            font-size: 12px; /* Smaller font size */
          }
          #staff-table button {
            padding: 4px 8px;
            font-size: 11px;
          }
          h2, h3 {
            font-size: 1.2em;
          }
        }
      `}</style>
    </div>
  );
}