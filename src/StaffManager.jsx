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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(response.data.message);
      fetchStaff();
    } catch (error) {
      alert('File upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: 'Arial', padding: '15px' }}>
      <h2>ניהול אנשי צוות - חטיבת נשים</h2>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>{editingId ? 'עריכת פרטי איש צוות' : 'הוספת איש צוות חדש'}</h3>
        <form onSubmit={editingId ? handleUpdate : handleSubmit} style={{ display: 'grid', gap: '10px' }} id="staff-form">
          <input type="text" name="id" placeholder="תעודת זהות" value={editingId ? editFormData.id : formData.id} onChange={editingId ? handleEditChange : handleChange} required disabled={editingId} style={{ padding: '8px' }} />
          <input type="text" name="first_name" placeholder="שם פרטי" value={editingId ? editFormData.first_name : formData.first_name} onChange={editingId ? handleEditChange : handleChange} required style={{ padding: '8px' }} />
          <input type="text" name="last_name" placeholder="שם משפחה" value={editingId ? editFormData.last_name : formData.last_name} onChange={editingId ? handleEditChange : handleChange} required style={{ padding: '8px' }} />

          <select name="role" value={editingId ? editFormData.role : formData.role} onChange={editingId ? handleEditChange : handleChange} style={{ padding: '8px' }}>
            <option value="מנהל">מנהל</option>
            <option value="מומחה">מומחה</option>
            <option value="מתמחה">מתמחה</option>
          </select>

          <input type="tel" name="phone" placeholder="טלפון" value={editingId ? editFormData.phone : formData.phone} onChange={editingId ? handleEditChange : handleChange} style={{ padding: '8px' }} />
          <input type="email" name="email" placeholder="דואר אלקטרוני" value={editingId ? editFormData.email : formData.email} onChange={editingId ? handleEditChange : handleChange} style={{ padding: '8px' }} />

          <button type="submit" style={{ padding: '10px', background: editingId ? '#28a745' : '#007BFF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            {editingId ? 'שמור שינויים' : 'הוסף איש צוות'}
          </button>
          {editingId && (
            <button type="button" onClick={() => setEditingId(null)} style={{ padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
              בטל
            </button>
          )}
        </form>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>העלאת קובץ CSV</h3>
          <input type="file" onChange={handleFileChange} accept=".csv" />
          <button onClick={handleFileUpload} style={{ padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            העלה קובץ
          </button>
      </div>

      <div style={{ border: '1px solid #dc3545', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>אזור סכנה</h3>
          <button onClick={handleDeleteAll} style={{ padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            מחק את כל אנשי הצוות
          </button>
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
                  <button onClick={() => handleEditClick(staff)} style={{ background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold', marginRight: '5px' }}>
                    ערוך
                  </button>
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