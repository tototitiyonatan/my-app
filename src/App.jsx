import { useState } from 'react';
import StaffManager from './StaffManager';
import Dashboard from './Dashboard';
import AbsenceManager from './AbsenceManager';
import ScheduleManager from './ScheduleManager';
import LeaveRequestsManager from './LeaveRequestsManager';
import MonthlyView from './MonthlyView'; // Import the new component
import Login from './Login';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    backgroundColor: activeTab === tabName ? '#007BFF' : '#e0e0e0',
    color: activeTab === tabName ? 'white' : 'black',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
  });

  return (
    <div dir="rtl" style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#333', margin: 0, fontSize: '24px' }}>מערכת ניהול חטיבת נשים סורוקה</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>שלום, <strong>{user.name}</strong></span>
          <button onClick={() => setUser(null)} style={{ padding: '5px 10px', background: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            התנתק
          </button>
        </div>
      </div>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', paddingBottom: '20px', flexWrap: 'wrap' }}>
        <button style={buttonStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
          📊 דאשבורד
        </button>
        <button style={buttonStyle('schedule')} onClick={() => setActiveTab('schedule')}>
          📅 סידור עבודה יומי
        </button>
        <button style={buttonStyle('monthly')} onClick={() => setActiveTab('monthly')}>
          🗓️ תצוגה חודשית
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

      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'schedule' && <ScheduleManager isAdmin={isAdmin} />}
      {activeTab === 'monthly' && <MonthlyView />}
      {activeTab === 'leaveRequests' && <LeaveRequestsManager user={user} />}
      {isAdmin && activeTab === 'staff' && <StaffManager />}
      {isAdmin && activeTab === 'absences' && <AbsenceManager />}
    </div>
  );
}

export default App;