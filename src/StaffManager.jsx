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
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/', formData);
      alert('איש צוות נוסף בהצלחה!');
      fetchStaff();
      setFormData({ id: '', first_name: '', last_name: '', role: 'מתמחה', phone: '', email: '' });
    } catch (error) {
      alert('שגיאה בהוספת איש צוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/staff/${editingId}`, editFormData);
      alert('פרטי איש צוות עודכנו בהצלחה!');
      setEditingId(null);
      fetchStaff();
    } catch (error) {
      alert('שגיאה בעדכון פרטי איש צוות: ' + (error.response?.data?.detail || error.message));
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

  const handleDeleteAll = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל אנשי הצוות? פעולה זו אינה הפיכה.')) return;
    try {
      await api.delete('/staff/all');
      alert('כל אנשי הצוות נמחקו בהצלחה');
      fetchStaff();
    } catch (error) {
      alert('שגיאה במחיקת כל אנשי הצוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditClick = (staff) => {
    setEditingId(staff.id);
    setEditFormData(staff);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", selectedFile);

    try {
      const response = await api.post("/staff/upload", uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
      fetchStaff();
    } catch (error) {
      alert('File upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h2 className="section-title">ניהול אנשי צוות</h2>

      <div className="card section-spacing">
        <h3>{editingId ? 'עריכת פרטי איש צוות' : 'הוספת איש צוות חדש'}</h3>
        <form onSubmit={editingId ? handleUpdate : handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">תעודת זהות</label>
            <input type="text" name="id" className="form-input" placeholder="תעודת זהות" value={editingId ? editFormData.id : formData.id} onChange={editingId ? handleEditChange : handleChange} required disabled={editingId} />
          </div>
          <div className="form-group">
            <label className="form-label">שם פרטי</label>
            <input type="text" name="first_name" className="form-input" placeholder="שם פרטי" value={editingId ? editFormData.first_name : formData.first_name} onChange={editingId ? handleEditChange : handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">שם משפחה</label>
            <input type="text" name="last_name" className="form-input" placeholder="שם משפחה" value={editingId ? editFormData.last_name : formData.last_name} onChange={editingId ? handleEditChange : handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">תפקיד</label>
            <select name="role" className="form-select" value={editingId ? editFormData.role : formData.role} onChange={editingId ? handleEditChange : handleChange}>
              <option value="מנהל">מנהל</option>
              <option value="מומחה">מומחה</option>
              <option value="מתמחה">מתמחה</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">טלפון</label>
            <input type="tel" name="phone" className="form-input" placeholder="טלפון" value={editingId ? editFormData.phone : formData.phone} onChange={editingId ? handleEditChange : handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">דואר אלקטרוני</label>
            <input type="email" name="email" className="form-input" placeholder="דואר אלקטרוני" value={editingId ? editFormData.email : formData.email} onChange={editingId ? handleEditChange : handleChange} />
          </div>
          <div className="form-group full-width action-row">
            <button type="submit" className={`btn ${editingId ? 'btn-success' : 'btn-primary'}`}>
              {editingId ? 'שמור שינויים' : 'הוסף איש צוות'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={() => setEditingId(null)}>
                בטל
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card section-spacing">
        <h3>העלאת קובץ CSV</h3>
        <div className="action-row">
          <input type="file" onChange={handleFileChange} accept=".csv" />
          <button onClick={handleFileUpload} className="btn btn-secondary">
            העלה קובץ
          </button>
        </div>
      </div>

      <div className="card card-danger section-spacing">
        <h3>אזור סכנה</h3>
        <button onClick={handleDeleteAll} className="btn btn-danger">
          מחק את כל אנשי הצוות
        </button>
      </div>

      <h3>רשימת הצוות</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ת.ז</th>
              <th>שם מלא</th>
              <th>תפקיד</th>
              <th>טלפון</th>
              <th>דוא"ל</th>
              <th style={{ textAlign: 'center' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td><strong>{staff.first_name} {staff.last_name}</strong></td>
                <td><span className="badge badge-info">{staff.role}</span></td>
                <td>{staff.phone}</td>
                <td>{staff.email}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-row" style={{ justifyContent: 'center' }}>
                    <button onClick={() => handleEditClick(staff)} className="btn btn-warning btn-sm">
                      ערוך
                    </button>
                    <button onClick={() => handleDelete(staff.id)} className="btn btn-danger btn-sm" title="הסר איש צוות">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
