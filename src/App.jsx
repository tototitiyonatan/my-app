import { useState } from 'react';
import StaffManager from './StaffManager';
import Dashboard from './Dashboard';
import AbsenceManager from './AbsenceManager';
import ScheduleManager from './ScheduleManager';
import LeaveRequestsManager from './LeaveRequestsManager';
import Login from './Login';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === 'admin';

  const buttonStyle = (tabName) => ({
    padding: '10px 16px',
    fontSize: '15px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: activeTab === tabName ? '#007BFF' : '#f1f3f5',
    color: activeTab === tabName ? 'white' : '#333333',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    boxShadow: activeTab === tabName ? '0 2px 4px rgba(0,123,255,0.3)' : 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap', // מונע שבירת מילים בכפתורים
  });

  return (
    <div dir="rtl" style={{
      fontFamily: 'Arial, sans-serif',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      color: '#212529',
      boxSizing: 'box-sizing'
    }}>

      {/* סרגל עליון */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '12px 15px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '20px' }}>מערכת ניהול סורוקה</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>שלום, <strong>{user.name}</strong></span>
          <button onClick={() => setUser(null)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            התנתק
          </button>
        </div>
      </div>

      {/* תפריט ניווט דינמי שמתאים את עצמו למסך */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button style={buttonStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
          📊 דאשבורד
        </button>
        <button style={buttonStyle('schedule')} onClick={() => setActiveTab('schedule')}>
          📅 סידור עבודה
        </button>
        <button style={buttonStyle('leaveRequests')} onClick={() => setActiveTab('leaveRequests')}>
          ✉️ בקשות חופשה
        </button>

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

      {/* אזור תוכן רספונסיבי */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflowX: 'auto' // מאפשר גלילה אופקית בטבלאות רחבות בטלפון מבלי לשבור את המסך
      }}>
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