import { useState, useEffect } from 'react';
import api from './api';
import { fetchHolidaysForMonth, holidaysByDayOfMonth } from './holidays';
import { StaffName } from './staffDisplay';

export default function MonthlyView() {
  const [schedules, setSchedules] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState([]);
  const [internStages, setInternStages] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState({});

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    loadHolidays();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      const [schedRes, staffRes, stationsRes, stagesRes] = await Promise.all([
        api.get('/schedules/'),
        api.get('/staff/'),
        api.get('/stations/'),
        api.get('/intern-stages/'),
      ]);
      setSchedules(schedRes.data);
      setStaff(staffRes.data.filter(s => s.role === 'מתמחה'));
      setStations(stationsRes.data);
      setInternStages(stagesRes.data);
    } catch (error) { console.error('שגיאה בשליפת נתונים:', error); }
  };

  const loadHolidays = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthHolidays = await fetchHolidaysForMonth(year, month);
    setHolidays(holidaysByDayOfMonth(monthHolidays, year, month));
  };

  const handleMonthChange = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const getStationName = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    return station ? station.name : '';
  };

  const getStageForIntern = (staffId, year, month) => {
    const stage = internStages.find(s => s.staff_id === staffId && s.year === year && s.month === month);
    return stage ? stage.stage_name : null;
  };

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="table-wrapper">
        <table className="data-table" style={{ textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', right: 0, background: '#f8fafc', zIndex: 1 }}>מתמחה</th>
              {monthDays.map(day => (
                <th key={day} style={{ minWidth: '40px' }}>
                  {day}
                  {holidays[day] && (
                    <div className="holiday-label" title={holidays[day]}>{holidays[day]}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(intern => {
              const internSchedules = schedules.filter(s => s.staff_id === intern.id);
              const stage = getStageForIntern(intern.id, year, month + 1);
              let consecutiveCount = 0;
              let lastStationId = null;

              return (
                <tr key={intern.id}>
                  <td style={{ whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'white', zIndex: 1 }}>
                    <StaffName person={intern} as="strong" />
                    {stage && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stage})</div>}
                  </td>
                  {monthDays.map(day => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const schedule = internSchedules.find(s => s.date === dateStr);

                    if (schedule) {
                      if (schedule.station_id === lastStationId) { consecutiveCount++; }
                      else { consecutiveCount = 1; lastStationId = schedule.station_id; }
                    } else { consecutiveCount = 0; lastStationId = null; }

                    return (
                      <td key={day} style={{ background: schedule ? 'var(--primary-light)' : 'transparent', fontSize: '0.75rem' }}>
                        {schedule ? getStationName(schedule.station_id) : ''}
                        {consecutiveCount > 1 && (
                          <span style={{ color: 'var(--danger)', marginRight: '2px' }}>({consecutiveCount})</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="section-title">תצוגה חודשית — מתמחים</h2>

      <div className="date-nav">
        <button className="btn btn-outline" onClick={() => handleMonthChange(-1)}>חודש קודם ➡️</button>
        <div className="date-nav-label">
          {currentDate.toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
        </div>
        <button className="btn btn-outline" onClick={() => handleMonthChange(1)}>⬅️ חודש הבא</button>
      </div>

      {renderMonthGrid()}
    </div>
  );
}
