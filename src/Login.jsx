import { useState, useEffect } from 'react';
import axios from './api';

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState(''); // שדה הסיסמה החדש
  const [error, setError] = useState('');
  const [staffList, setStaffList] = useState([]);

  // מושכים את רשימת אנשי הצוות כדי שנוכל לאמת תעודות זהות וסיסמאות
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/staff/');
        setStaffList(response.data);
      } catch (err) {
        console.error('שגיאה בטעינת נתונים', err);
      }
    };
    fetchStaff();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. התחברות מנהל
    if (userId === 'admin') {
      if (password === 'soroka') {
        onLogin({ role: 'admin', name: 'מנהל מערכת' });
      } else {
        setError('סיסמת מנהל שגויה.');
      }
      return;
    }

    // 2. התחברות איש צוות (לפי ת.ז)
    const person = staffList.find(s => s.id === userId);
    if (person) {
      // בדיקת סיסמה מול מספר הטלפון ששמור במסד הנתונים
      if (password === person.phone) {
        onLogin({
          role: 'guest',
          name: `${person.first_name} ${person.last_name}`,
          id: person.id
        });
      } else {
        setError('סיסמה שגויה. הסיסמה שלך היא מספר הטלפון המעודכן במערכת.');
      }
    } else {
      setError('תעודת זהות לא נמצאה במערכת. נסה שוב או פנה למנהל.');
    }
  };

  return (
    <div dir="rtl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>כניסה למערכת</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>חטיבת נשים סורוקה</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder="תעודת זהות (או admin)"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setError(''); }}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
          />

          {/* שדה הקלדת סיסמה */}
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
          />

          {error && <div style={{ color: '#F44336', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

          <button type="submit" style={{ padding: '12px', background: '#007BFF', color: 'white', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            התחבר
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '13px', color: '#777', lineHeight: '1.6' }}>
          * מנהל: הזן סיסמת ניהול.<br/>
          * רופאים/מתמחים: הסיסמה היא <strong>מספר הטלפון</strong> שלכם.
        </div>
      </div>
    </div>
  );
}