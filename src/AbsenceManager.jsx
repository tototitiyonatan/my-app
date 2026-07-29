import { useState, useEffect } from 'react';
import api from './api';

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
      const response = await api.get('/staff/');
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
      const response = await api.get('/absences/');
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
      await api.post('/absences/', formData);
      alert('היעדרות נרשמה בהצלחה!');
      fetchAbsences();
      setFormData(prev => ({ ...prev, start_date: today, end_date: today, notes: '' }));
    } catch (error) {
      alert('שגיאה בהוספת היעדרות: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק היעדרות זו?')) return;
    try {
      await api.delete(`/absences/${id}`);
      alert('ההיעדרות נמחקה בהצלחה!');
      fetchAbsences();
    } catch (error) {
      alert('שגיאה במחיקת ההיעדרות');
    }
  };

  const getStaffName = (id) => {
    const person = staffList.find(s => s.id === id);
    return person ? `${person.first_name} ${person.last_name}` : id;
  };

  return (
    <div>
      <h2 className="section-title">ניהול היעדרויות</h2>

      <div className="card section-spacing">
        <h3>רישום היעדרות חדשה</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">איש צוות</label>
            <select name="staff_id" className="form-select" value={formData.staff_id} onChange={handleChange} required>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name} ({staff.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">סטטוס</label>
            <select name="status_type" className="form-select" value={formData.status_type} onChange={handleChange}>
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

          <div className="form-group">
            <label className="form-label">מתאריך</label>
            <input type="date" name="start_date" className="form-input" value={formData.start_date} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">עד תאריך</label>
            <input type="date" name="end_date" className="form-input" min={formData.start_date} value={formData.end_date} onChange={handleChange} required />
          </div>

          <div className="form-group full-width">
            <label className="form-label">הערות</label>
            <input type="text" name="notes" className="form-input" placeholder="לדוגמה: כנס בחו״ל..." value={formData.notes} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <button type="submit" className="btn btn-danger">
              שמור היעדרות במערכת
            </button>
          </div>
        </form>
      </div>

      <h3>היעדרויות קודמות ועתידיות</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>שם איש צוות</th>
              <th>סוג היעדרות</th>
              <th>מתאריך</th>
              <th>עד תאריך</th>
              <th>הערות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {absencesList.map((absence) => (
              <tr key={absence.id}>
                <td><strong>{getStaffName(absence.staff_id)}</strong></td>
                <td><span className="badge badge-danger">{absence.status_type}</span></td>
                <td>{formatDateToIL(absence.start_date)}</td>
                <td>{formatDateToIL(absence.end_date)}</td>
                <td>{absence.notes}</td>
                <td>
                  <button onClick={() => handleDelete(absence.id)} className="btn btn-danger btn-sm">
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
