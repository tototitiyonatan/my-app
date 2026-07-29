import { useState, useEffect, useRef } from 'react';
import api from './api';
import { findStaffByLogin } from './staffDisplay';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = userId.trim();
  const suggestions = query.length >= 1 && !selectedPerson
    ? staffList.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.last_name.toLowerCase().startsWith(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.id.startsWith(query) ||
          s.first_name.toLowerCase().startsWith(q)
        );
      }).slice(0, 8)
    : [];

  const handleSelectSuggestion = (person) => {
    setUserId(person.last_name);
    setSelectedPerson(person);
    setShowSuggestions(false);
    setError('');
  };

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

    const person = selectedPerson || findStaffByLogin(staffList, userId);
    if (person) {
      if (password.trim() === person.last_name.trim()) {
        onLogin({
          role: 'guest',
          name: person.last_name,
          id: person.id,
        });
      } else {
        setError('סיסמה שגויה. הסיסמה היא שם המשפחה שלך.');
      }
    } else {
      const lastNameMatches = staffList.filter(
        (s) => s.last_name.trim().toLowerCase() === query.toLowerCase()
      );
      if (lastNameMatches.length > 1) {
        setError('נמצאו מספר אנשי צוות עם שם משפחה זה. בחר מהרשימה.');
      } else {
        setError('לא נמצא במערכת. בחר שם משפחה מהרשימה או פנה למנהל.');
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
          <div className="form-group login-autocomplete" ref={wrapperRef}>
            <label className="form-label">שם משפחה</label>
            <input
              type="text"
              className="form-input"
              placeholder="התחל להקליד שם משפחה..."
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setSelectedPerson(null);
                setError('');
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="login-suggestions">
                {suggestions.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      className="login-suggestion-btn"
                      onClick={() => handleSelectSuggestion(person)}
                    >
                      <strong>{person.last_name}</strong>
                      <span>{person.first_name} · {person.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">סיסמה (שם משפחה)</label>
            <input
              type="password"
              className="form-input"
              placeholder="הזן שם משפחה"
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
          רופאים/מתמחים: בחר שם משפחה מהרשימה.<br />
          שם משתמש וסיסמה הם <strong>שם המשפחה</strong> שלך.
        </p>
      </div>
    </div>
  );
}
