import { useState, useEffect } from 'react';
import api from './api';
import { findStaffByLogin } from './staffDisplay';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get('/staff/');
        setStaffList(response.data);
      } catch (err) {
        console.error('שגיאה בטעינת נתונים', err);
      }
    };
    fetchStaff();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    if (userId.trim().toLowerCase() === 'admin') {
      if (password === 'soroka') {
        onLogin({ role: 'admin', name: 'מנהל מערכת' });
      } else {
        setError('סיסמת מנהל שגויה.');
      }
      return;
    }

    const person = findStaffByLogin(staffList, userId);
    if (person) {
      if (password === person.phone) {
        onLogin({
          role: 'guest',
          name: person.last_name,
          id: person.id,
        });
      } else {
        setError('סיסמה שגויה. הסיסמה שלך היא מספר הטלפון המעודכן במערכת.');
      }
    } else {
      const trimmed = userId.trim();
      const lastNameMatches = staffList.filter(
        (s) => s.last_name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (lastNameMatches.length > 1) {
        setError('נמצאו מספר אנשי צוות עם שם משפחה זה. הזן ת.ז.');
      } else {
        setError('לא נמצא במערכת. הזן ת.ז. או שם משפחה, או פנה למנהל.');
      }
    }
  };

  return (
    <div dir="rtl" className="login-page">
      <div className="login-card">
        <div className="login-logo">🏥</div>
        <h2>כניסה למערכת</h2>
        <p className="login-subtitle">חטיבת נשים · בית חולים סורוקה</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">ת.ז. / שם משפחה</label>
            <input
              type="text"
              className="form-input"
              placeholder="הזן ת.ז., שם משפחה, או admin"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setError(''); }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה</label>
            <input
              type="password"
              className="form-input"
              placeholder="הזן סיסמה"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg btn-block">
            התחבר
          </button>
        </form>

        <p className="form-hint" style={{ marginTop: '1.5rem' }}>
          מנהל: הזן admin וסיסמת ניהול.<br />
          רופאים/מתמחים: ניתן להיכנס עם ת.ז. או שם משפחה.<br />
          הסיסמה היא <strong>מספר הטלפון</strong> המעודכן במערכת.
        </p>
      </div>
    </div>
  );
}
