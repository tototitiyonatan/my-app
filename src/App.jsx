import { useState } from 'react';
import StaffManager from './StaffManager';
import Dashboard from './Dashboard';
import AbsenceManager from './AbsenceManager';
import ScheduleManager from './ScheduleManager';
import LeaveRequestsManager from './LeaveRequestsManager';
import MonthlyView from './MonthlyView';
import Login from './Login';

const TABS = [
  { id: 'dashboard', label: 'דאשבורד', icon: '📊' },
  { id: 'schedule', label: 'סידור עבודה יומי', icon: '📅' },
  { id: 'monthly', label: 'תצוגה חודשית', icon: '🗓️' },
  { id: 'leaveRequests', label: 'בקשות חופשה', icon: '✉️' },
];

const ADMIN_TABS = [
  { id: 'staff', label: 'ניהול צוות', icon: '👨‍⚕️' },
  { id: 'absences', label: 'היעדרויות', icon: '🏖️' },
];

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === 'admin';
  const allTabs = isAdmin ? [...TABS, ...ADMIN_TABS] : TABS;

  return (
    <div dir="rtl" className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title">
            <span className="app-title-icon">🏥</span>
            <div>
              <h1>מערכת ניהול חטיבת נשים סורוקה</h1>
              <div className="app-title-sub">ניהול צוות, סידורים והיעדרויות</div>
            </div>
          </div>
          <div className="app-user-bar">
            <span className="app-user-greeting">
              שלום, <strong>{user.name}</strong>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setUser(null)}>
              התנתק
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className="app-nav-inner">
          {allTabs.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-tab${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedule' && <ScheduleManager isAdmin={isAdmin} />}
        {activeTab === 'monthly' && <MonthlyView />}
        {activeTab === 'leaveRequests' && <LeaveRequestsManager user={user} />}
        {isAdmin && activeTab === 'staff' && <StaffManager />}
        {isAdmin && activeTab === 'absences' && <AbsenceManager />}
      </main>
    </div>
  );
}

export default App;
