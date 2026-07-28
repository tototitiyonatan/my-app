import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AbsenceManager() {
  const [absencesList, setAbsencesList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    staff_id: '',
    start_date: today,
    end_date: today,
    status_type: 'חופשה',
    notes: ''
  });

  const formatDateToIL = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    fetchStaff();
    fetchAbsences();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/staff/');
      setStaffList(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, staff_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('שגיאה בשליפת צוות:', error);
    }
  };

  const fetchAbsences = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/absences/');
      setAbsencesList(response.data);
    } catch (error) {
      console.error('שגיאה בשליפת היעדרויות:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/absences/', formData);
      alert('היעדרות נרשמה בהצלחה!');
      fetchAbsences();
      setFormData(prev => ({
        ...prev,
        start_date: today,
        end_date: today,
        notes: ''
      }));
    } catch (error) {
      alert('שגיאה בהוספת היעדרות: ' + (error.response?.data?.detail || error.message));
    }
  };

  // פונקציית מחיקת היעדרות
  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק היעדרות זו?')) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/absences/${id}`);
      alert('ההיעדרות נמחקה בהצלחה!');
      fetchAbsences(); // רענון הטבלה
    } catch (error) {
      alert('שגיאה במחיקת ההיעדרות');
    }
  };

  const getStaffName = (id) => {
    const person = staffList.find(s => s.id === id);
    return person ? `${person.first_name} ${person.last_name}` : id;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>ניהול היעדרויות</h2>

      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#f9f9f9' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>איש צוות:</label>
            <select name="staff_id" value={formData.staff_id} onChange={handleChange} required style={{ padding: '8px' }}>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>סטטוס:</label>
            <select name="status_type" value={formData.status_type} onChange={handleChange} style={{ padding: '8px' }}>
              <option value="חופשה">חופשה</option>
              <option value="חופשת לידה">חופשת לידה</option>
              <option value="השתלמות">השתלמות</option>
              <option value="אחרי תורנות">אחרי תורנות</option>
              <option value="מחלה">מחלה</option>
              <option value="מחלת ילד">מחלת ילד</option>
              <option value="יום בחירה">יום בחירה</option>
              <option value="א.ס">א.ס (אישור ספציפי)</option>
              <option value="מילואים">מילואים</option>
              <option value="אחר">אחר (פירוט בהערות)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>מתאריך:</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required style={{ padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>עד תאריך:</label>
            <input type="date" name="end_date" min={formData.start_date} value={formData.end_date} onChange={handleChange} required style={{ padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
            <label>הערות (טקסט חופשי):</label>
            <input type="text" name="notes" placeholder="לדוגמה: כנס בחו״ל..." value={formData.notes} onChange={handleChange} style={{ padding: '8px' }} />
          </div>

          <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px', background: '#F44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            שמור היעדרות במערכת
          </button>
        </form>
      </div>

      <h3>היעדרויות קודמות ועתידיות</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: '#eee', borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px' }}>שם איש צוות</th>
            <th style={{ padding: '10px' }}>סוג היעדרות</th>
            <th style={{ padding: '10px' }}>מתאריך</th>
            <th style={{ padding: '10px' }}>עד תאריך</th>
            <th style={{ padding: '10px' }}>הערות</th>
            <th style={{ padding: '10px' }}>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {absencesList.map((absence) => (
            <tr key={absence.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{getStaffName(absence.staff_id)}</td>
              <td style={{ padding: '10px', color: '#d32f2f', fontWeight: 'bold' }}>{absence.status_type}</td>
              <td style={{ padding: '10px' }}>{formatDateToIL(absence.start_date)}</td>
              <td style={{ padding: '10px' }}>{formatDateToIL(absence.end_date)}</td>
              <td style={{ padding: '10px' }}>{absence.notes}</td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={() => handleDelete(absence.id)}
                  style={{ background: '#F44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  מחק
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}