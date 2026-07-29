import { useState, useEffect } from 'react';
import api from './api';
import { StaffName } from './staffDisplay';
import { getStageStyle } from './stageColors';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export default function InternshipProgramView({ user, isAdmin }) {
  const [staff, setStaff] = useState([]);
  const [internStages, setInternStages] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, stagesRes] = await Promise.all([
        api.get('/staff/'),
        api.get('/intern-stages/'),
      ]);
      setStaff(staffRes.data.filter((s) => s.role === 'מתמחה'));
      setInternStages(stagesRes.data);
    } catch (error) {
      console.error('שגיאה בשליפת תוכנית התמחות:', error);
    }
  };

  const getStage = (staffId, month) => {
    const stage = internStages.find(
      (s) => s.staff_id === staffId && s.year === year && s.month === month
    );
    return stage?.stage_name || '';
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('העלאה זו תחליף את תוכנית ההתמחות הקודמת. להמשיך?')) {
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setUploadMsg('');

    try {
      const res = await api.post('/intern-stages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMsg(res.data?.message || 'תוכנית ההתמחות עודכנה בהצלחה');
      await fetchData();
    } catch (error) {
      setUploadMsg(error.response?.data?.detail || 'שגיאה בהעלאת תוכנית ההתמחות');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const displayStaff = isAdmin
    ? staff
    : staff.filter((s) => s.id === user.id);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div className="page-header">
        <h2 className="section-title">
          {isAdmin ? 'תוכנית התמחות' : 'תוכנית ההתמחות שלי'}
        </h2>
        <div className="action-row">
          <label className="form-label" style={{ margin: 0 }}>שנה:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {isAdmin && (
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              {uploading ? '⏳ מעלה...' : '📄 העלה תוכנית מעודכנת'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {uploadMsg && (
        <div className={`card section-spacing${uploadMsg.includes('שגיאה') ? ' card-danger' : ' card-success'}`}>
          {uploadMsg}
        </div>
      )}

      {displayStaff.length === 0 ? (
        <div className="empty-state">לא נמצאו מתמחים להצגה.</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table internship-table">
            <thead>
              <tr>
                <th className="internship-sticky-col">מתמחה</th>
                {months.map((month) => (
                  <th key={month}>{MONTH_NAMES[month - 1]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayStaff.map((intern) => (
                <tr key={intern.id}>
                  <td className="internship-sticky-col">
                    <StaffName person={intern} as="strong" />
                  </td>
                  {months.map((month) => {
                    const stage = getStage(intern.id, month);
                    return (
                      <td key={month} style={getStageStyle(stage)}>
                        {stage || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
