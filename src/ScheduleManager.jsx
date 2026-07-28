import { useState, useEffect } from 'react';
import api from './api';

export default function ScheduleManager({ isAdmin }) {
  const [stations, setStations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [holidays, setHolidays] = useState({});

  const [newStationName, setNewStationName] = useState('');
  const [parentStationId, setParentStationId] = useState('');

  const [weekOffset, setWeekOffset] = useState(0);

  const formatDateToIL = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);

      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const day = String(nextDay.getDate()).padStart(2, '0');

      days.push(`${year}-${month}-${day}`);
    }
    return days;
  };

  const currentWeekDays = getDaysOfWeek();

  useEffect(() => {
    fetchData();
    fetchHolidays(currentWeekDays);
  }, [weekOffset]);

  const fetchHolidays = async (days) => {
    const newHolidays = {};
    const firstDay = new Date(days[0]);
    const lastDay = new Date(days[6]);
    const months = new Set([firstDay.getMonth() + 1, lastDay.getMonth() + 1]);
    const year = firstDay.getFullYear();

    console.log(`Fetching holidays for months: ${[...months]} in year ${year}`);

    // Fetch Hebrew holidays
    for (const month of months) {
        try {
            const hebcalResponse = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=${month}&ss=on&mf=on&c=on&geo=geoname&geonameid=293397&m=50&s=on`);
            const hebcalData = await hebcalResponse.json();
            console.log("Hebcal API response for month", month, hebcalData);
            if (hebcalData.items) {
                hebcalData.items.forEach(event => {
                    const eventDate = new Date(event.date).toISOString().split('T')[0];
                    if (days.includes(eventDate)) {
                        newHolidays[eventDate] = newHolidays[eventDate] ? `${newHolidays[eventDate]}, ${event.title}` : event.title;
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching Hebrew holidays:', error);
        }
    }

    // Fetch Islamic holidays
    for (const day of days) {
        try {
            const [y, m, d] = day.split('-');
            const hijriResponse = await fetch(`https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`);
            const hijriData = await hijriResponse.json();
            if (hijriData.data.hijri.holidays.length > 0) {
                const holidayName = hijriData.data.hijri.holidays[0];
                console.log("Found Islamic holiday:", holidayName, "on", day);
                newHolidays[day] = newHolidys[day] ? `${newHolidays[day]}, ${holidayName}` : holidayName;
            }
        } catch (error) {
            console.error('Error fetching Islamic holidays:', error);
        }
    }

    console.log("Final holidays object:", newHolidays);
    setHolidays(newHolidays);
  };

  const fetchData = async () => {
    try {
      const [stationsRes, staffRes, schedRes, absRes] = await Promise.all([
        api.get('/stations/'),
        api.get('/staff/'),
        api.get('/schedules/'),
        api.get('/absences/')
      ]);
      setStations(stationsRes.data);
      setStaff(staffRes.data);
      setSchedules(schedRes.data);
      setAbsences(absRes.data);
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!newStationName) return;
    try {
      await api.post('/stations/', {
        name: newStationName,
        parent_station_id: parentStationId ? parseInt(parentStationId) : null
      });
      setNewStationName('');
      setParentStationId('');
      fetchData();
    } catch (error) {
      alert('שגיאה בהוספת תחנה');
    }
  };

  const handleAddSchedule = async (date, stationId, staffId) => {
    if (!staffId) return;
    try {
      await api.post('/schedules/', {
        staff_id: staffId, date: date, station_id: stationId
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'שגיאה בשיבוץ');
    }
  };

  // פונקציית מחיקת שיבוץ מתחנה
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      fetchData(); // רענון הטבלה
    } catch (error) {
      alert(error.response?.data?.detail || 'שגיאה במחיקת השיבוץ');
    }
  };

  const getStaffName = (id) => {
    const person = staff.find(s => s.id === id);
    return person ? `${person.first_name} ${person.last_name}` : id;
  };

  const exportToExcel = () => {
    const startDate = currentWeekDays[0];
    const endDate = currentWeekDays[6];
    window.location.href = `/schedules/export/excel?start_date=${startDate}&end_date=${endDate}`;
  };

  const mainStations = stations.filter(s => s.parent_station_id === null);
  const headerGroups = [];
  const displayColumns = [];

  mainStations.forEach(main => {
    const subs = stations.filter(s => s.parent_station_id === main.id);
    if (subs.length > 0) {
      headerGroups.push({ id: main.id, name: main.name, colSpan: subs.length });
      subs.forEach(sub => displayColumns.push(sub));
    } else {
      headerGroups.push({ id: main.id, name: main.name, colSpan: 1 });
      displayColumns.push(main);
    }
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 10px' }}>

      <div id="controls-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', flexWrap: 'wrap', gap: '15px' }}>
        {isAdmin ? (
          <form onSubmit={handleAddStation} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="שם התחנה החדשה..."
              value={newStationName}
              onChange={(e) => setNewStationName(e.target.value)}
              style={{ padding: '8px', flex: '1 1 150px' }}
            />
            <select
              value={parentStationId}
              onChange={(e) => setParentStationId(e.target.value)}
              style={{ padding: '8px', flex: '1 1 150px' }}
            >
              <option value="">-- זוהי תחנה ראשית --</option>
              {mainStations.map(station => (
                <option key={station.id} value={station.id}>תת-תחנה של: {station.name}</option>
              ))}
            </select>
            <button type="submit" style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1 1 100px' }}>
              הוסף תחנה
            </button>
          </form>
        ) : (
          <div style={{ fontWeight: 'bold', color: '#666' }}>תצוגת מערכת קריאה בלבד</div>
        )}

        <div id="action-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportToExcel} style={{ padding: '8px 15px', background: '#217346', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            📊 ייצוא לאקסל
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 15px', background: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            🖨️ הדפס PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setWeekOffset(prev => prev + 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>שבוע הבא ⬅️</button>
        <h3 style={{ margin: 0, fontSize: '1.1em', textAlign: 'center' }}>שבוע: {formatDateToIL(currentWeekDays[0])} עד {formatDateToIL(currentWeekDays[6])}</h3>
        <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>➡️ שבוע קודם</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#3F51B5', color: 'white' }}>
              <th rowSpan="2" style={{ padding: '10px 5px', border: '1px solid #ddd', minWidth: '90px' }}>תאריך</th>
              {headerGroups.map(hg => (
                <th key={hg.id} colSpan={hg.colSpan} style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {hg.name}
                </th>
              ))}
              <th rowSpan="2" style={{ padding: '10px 5px', border: '1px solid #ddd', background: '#F44336', minWidth: '100px' }}>לא נמצא</th>
            </tr>
            <tr style={{ background: '#5C6BC0', color: 'white', fontSize: '13px' }}>
              {displayColumns.map(col => (
                <th key={col.id} style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'normal' }}>
                  {col.parent_station_id ? col.name : 'ראשי'}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentWeekDays.map(day => (
              <tr key={day}>
                <td style={{ padding: '8px 5px', border: '1px solid #ddd', background: '#f9f9f9', fontWeight: 'bold', fontSize: '13px' }}>
                  {new Date(day + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'short' })}<br/>
                  <span style={{ fontSize: '11px', color: '#666' }}>{formatDateToIL(day)}</span>
                  {holidays[day] && <div style={{ fontSize: '10px', color: 'darkblue' }}>{holidays[day]}</div>}
                </td>

                {displayColumns.map(station => {
                  const scheduledHere = schedules.filter(s => s.date === day && s.station_id === station.id);

                  return (
                    <td key={station.id} style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                      {scheduledHere.map(s => (
                        <div key={s.id} style={{ background: '#E3F2FD', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                          <span style={{ flexShrink: 1 }}>{getStaffName(s.staff_id)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              style={{ background: 'none', border: 'none', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', padding: '0 3px' }}
                              title="הסר שיבוץ"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      {isAdmin && (
                        <select
                          onChange={(e) => {
                            handleAddSchedule(day, station.id, e.target.value);
                            e.target.value = "";
                          }}
                          style={{ width: '100%', marginTop: '5px', padding: '4px', fontSize: '12px' }}
                        >
                          <option value="">+ שבץ רופא</option>
                          {staff.map(person => (
                            <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  );
                })}

                <td style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top', background: '#ffebee' }}>
                  {absences
                    .filter(a => a.start_date <= day && a.end_date >= day)
                    .map(absence => (
                      <div key={absence.id} style={{ background: 'white', border: '1px solid #ffcdd2', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', textAlign: 'right' }}>
                        <strong>{getStaffName(absence.staff_id)}</strong><br/>
                        <span style={{ fontSize: '11px', color: '#c62828' }}>{absence.status_type}</span>
                      </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          form, button, select, #controls-panel, #action-buttons { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
          @page { size: landscape; }
        }
        @media (max-width: 768px) {
          #controls-panel, #action-buttons {
            flex-direction: column;
            align-items: stretch;
          }
          #controls-panel form {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }
          h3 {
            font-size: 1em;
          }
          th, td {
            padding: 5px !important;
            font-size: 12px !important;
          }
          span, strong {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}