import { useState } from 'react';
import StaffManager from './StaffManager';
import Dashboard from './Dashboard';
import AbsenceManager from './AbsenceManager';
import ScheduleManager from './ScheduleManager';
import LeaveRequestsManager from './LeaveRequestsManager';
import Login from './Login';

function App() {
  const [user, setUser] = useState(null); // שמירת המשתמש המחובר
  const [activeTab, setActiveTab] = useState('dashboard');

  // אם אין משתמש מחובר, נציג רק את מסך ההתחברות
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === 'admin';

  const buttonStyle = (tabName) => ({
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: activeTab === tabName ? '#007BFF' : '#f1f3f5',
    color: activeTab === tabName ? 'white' : '#333333',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    boxShadow: activeTab === tabName ? '0 2px 4px rgba(0,123,255,0.3)' : 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <div dir="rtl" style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f8f9fa', // רקע כללי בהיר ונקי לעמוד
      minHeight: '100vh',
      color: '#212529' // צבע טקסט כללי כהה וקריא
    }}>

      {/* סרגל עליון עם שם המשתמש וכפתור התנתקות */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #dee2e6',
        paddingBottom: '10px',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '22px' }}>מערכת ניהול חטיבת נשים סורוקה</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>שלום, <strong>{user.name}</strong></span>
          <button onClick={() => setUser(null)} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            התנתק
          </button>
        </div>
      </div>

      {/* תפריט ניווט דינמי */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button style={buttonStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
          📊 דאשבורד
        </button>
        <button style={buttonStyle('schedule')} onClick={() => setActiveTab('schedule')}>
          📅 סידור עבודה שבועי
        </button>
        <button style={buttonStyle('leaveRequests')} onClick={() => setActiveTab('leaveRequests')}>
          ✉️ בקשות חופשה
        </button>

        {/* לשוניות שמוצגות למנהל בלבד! */}
        {isAdmin && (
          <>
            <button style={buttonStyle('staff')} onClick={() => setActiveTab('staff')}>
              👨‍⚕️ ניהול צוות
            </button>
            <button style={buttonStyle('absences')} onClick={() => setActiveTab('absences')}>
              🏖️ היעדרויות
            </button>
          </>
        )}
      </nav>

      {/* אזור התצוגה המשתנה בהתאם ללשונית הנבחרת */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedule' && <ScheduleManager isAdmin={isAdmin} />}
        {activeTab === 'leaveRequests' && <LeaveRequestsManager user={user} />}
        {isAdmin && activeTab === 'staff' && <StaffManager />}
        {isAdmin && activeTab === 'absences' && <AbsenceManager />}
      </div>
    </div>
  );
}

export default App;