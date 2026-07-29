import { useState, useEffect } from 'react';
import api from './api';
import { StaffName } from './staffDisplay';
import { TRAINING_OPTIONS, mergeStaffWithTraining, setTraining } from './staffTraining';
import InternProgramSingle from './InternProgramSingle';

export default function StaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    first_name: '',
    last_name: '',
    role: 'מתמחה',
    phone: '',
    email: '',
    training: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingIntern, setViewingIntern] = useState(null);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff/');
      setStaffList(mergeStaffWithTraining(response.data));
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

  const buildStaffPayload = (data) => {
    const payload = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      phone: data.phone || null,
      email: data.email || null,
    };
    if (data.role === 'מתמחה') {
      payload.training = data.training || null;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/', buildStaffPayload(formData));
      if (formData.role === 'מתמחה') {
        setTraining(formData.id, formData.training || '');
      }
      alert('איש צוות נוסף בהצלחה!');
      fetchStaff();
      setFormData({ id: '', first_name: '', last_name: '', role: 'מתמחה', phone: '', email: '', training: '' });
    } catch (error) {
      alert('שגיאה בהוספת איש צוות: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, ...updateFields } = buildStaffPayload(editFormData);
    try {
      await api.put(`/staff/${editingId}`, updateFields);
      if (editFormData.role === 'מתמחה') {
        setTraining(editingId, editFormData.training || '');
      } else {
        setTraining(editingId, '');
      }
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
      setTraining(id, '');
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
    setEditFormData({
      ...staff,
      training: staff.role === 'מתמחה' ? (staff.training || '') : '',
    });
  };

  const handleTrainingChange = (staffId, value) => {
    setTraining(staffId, value);
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, training: value || '' } : s))
    );
    api.put(`/staff/${staffId}`, { training: value || null }).catch(() => {});
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);

    try {
      const response = await api.post('/staff/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(response.data.message);
      fetchStaff();
    } catch (error) {
      alert('File upload failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const training = s.training || '';
    return (
      s.id.includes(q) ||
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      training.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  const showTrainingField = editingId
    ? editFormData.role === 'מתמחה'
    : formData.role === 'מתמחה';

  return (
    <div>
      <h2 className="section-title">ניהול אנשי צוות</h2>

      {viewingIntern && (
        <div className="modal-overlay" onClick={() => setViewingIntern(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <InternProgramSingle staff={viewingIntern} onClose={() => setViewingIntern(null)} />
          </div>
        </div>
      )}

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
              <option value="מומחה">מומחה</option>
              <option value="מתמחה">מתמחה</option>
            </select>
          </div>
          {showTrainingField && (
            <div className="form-group">
              <label className="form-label">הכשרה</label>
              <select
                name="training"
                className="form-select"
                value={editingId ? (editFormData.training || '') : (formData.training || '')}
                onChange={editingId ? handleEditChange : handleChange}
              >
                <option value="">— ללא —</option>
                {TRAINING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
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
      <div className="form-group section-spacing" style={{ maxWidth: '400px' }}>
        <label className="form-label">חיפוש</label>
        <input
          type="search"
          className="form-input"
          placeholder="חפש לפי שם, ת.ז., תפקיד, הכשרה, טלפון..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ת.ז</th>
              <th>שם מלא</th>
              <th>תפקיד</th>
              <th>הכשרה</th>
              <th>טלפון</th>
              <th>דוא"ל</th>
              <th style={{ textAlign: 'center' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>
                  {staff.role === 'מתמחה' ? (
                    <button
                      type="button"
                      className="staff-name-link"
                      onClick={() => setViewingIntern(staff)}
                      title="לחץ לצפייה בתוכנית התמחות"
                    >
                      <StaffName person={staff} as="strong" />
                    </button>
                  ) : (
                    <StaffName person={staff} as="strong" />
                  )}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({staff.first_name})</span>
                </td>
                <td><span className="badge badge-info">{staff.role}</span></td>
                <td>
                  {staff.role === 'מתמחה' ? (
                    <select
                      className="form-select"
                      style={{ minWidth: '160px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                      value={staff.training || ''}
                      onChange={(e) => handleTrainingChange(staff.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {TRAINING_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    '—'
                  )}
                </td>
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
