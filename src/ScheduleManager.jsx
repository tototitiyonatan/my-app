import { useState, useEffect } from 'react';
import api from './api';

export default function ScheduleManager({ isAdmin }) {
  const [stations, setStations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [internStages, setInternStages] = useState([]);

  const [newStationName, setNewStationName] = useState('');
  const [parentStationId, setParentStationId] = useState('');
  const [dayOffset, setDayOffset] = useState(0);
  const [draggedStaffId, setDraggedStaffId] = useState(null);
  const [stageUploadMsg, setStageUploadMsg] = useState('');

  const formatDateToIL = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const getSingleDay = () => {
    const today = new Date();
    today.setDate(today.getDate() + dayOffset);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentDay = getSingleDay();

  useEffect(() => {
    fetchData();
    fetchHolidays([currentDay]);
  }, [dayOffset]);

  const fetchHolidays = async (days) => {
    const newHolidays = {};
    const firstDay = new Date(days[0]);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth() + 1;
    const majorIslamicHolidays = ["Eid al-Fitr", "Eid al-Adha", "Laylat al-Qadr", "Muharram", "Mawlid al-Nabi"];

    try {
      const hebcalResponse = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&year=${year}&month=${month}&geonameid=293397`);
      const hebcalData = await hebcalResponse.json();
      if (hebcalData.items) {
        hebcalData.items.forEach(event => {
          const eventDate = new Date(event.date).toISOString().split('T')[0];
          if (days.includes(eventDate)) {
            newHolidays[eventDate] = newHolidays[eventDate] ? `${newHolidays[eventDate]}, ${event.title}` : event.title;
          }
        });
      }
    } catch (error) { console.error('Error fetching Hebrew holidays:', error); }

    for (const day of days) {
      try {
        const [y, m, d] = day.split('-');
        const hijriResponse = await fetch(`https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`);
        const hijriData = await hijriResponse.json();
        if (hijriData.data.hijri.holidays.length > 0) {
          hijriData.data.hijri.holidays.forEach(holidayName => {
            if (majorIslamicHolidays.some(mh => holidayName.includes(mh))) {
              newHolidays[day] = newHolidays[day] ? `${newHolidays[day]}, ${holidayName}` : holidayName;
            }
          });
        }
      } catch (error) { console.error('Error fetching Islamic holidays:', error); }
    }
    setHolidays(newHolidays);
  };

  const fetchData = async () => {
    try {
      const [stationsRes, staffRes, schedRes, absRes, stagesRes] = await Promise.all([
        api.get('/stations/'),
        api.get('/staff/'),
        api.get('/schedules/'),
        api.get('/absences/'),
        api.get('/intern-stages/')
      ]);
      setStations(stationsRes.data);
      setStaff(staffRes.data);
      setSchedules(schedRes.data);
      setAbsences(absRes.data);
      setInternStages(stagesRes.data);
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    }
  };

  const handleAddStation = async (e) => {
    e.preventDefault();
    if (!newStationName) return;
    try {
      await api.post('/stations/', { name: newStationName, parent_station_id: parentStationId ? parseInt(parentStationId) : null });
      setNewStationName('');
      setParentStationId('');
      fetchData();
    } catch (error) { alert('שגיאה בהוספת תחנה'); }
  };

  const handleAddSchedule = async (date, stationId, staffId) => {
    if (!staffId) return;
    try {
      await api.post('/schedules/', { staff_id: staffId, date, station_id: stationId });
      fetchData();
    } catch (error) { alert(error.response?.data?.detail || 'שגיאה בשיבוץ'); }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      fetchData();
    } catch (error) { alert(error.response?.data?.detail || 'שגיאה במחיקת השיבוץ'); }
  };

  const handleUploadStages = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/intern-stages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStageUploadMsg(res.data.message);
      fetchData();
    } catch (error) {
      setStageUploadMsg(error.response?.data?.detail || 'שגיאה בהעלאת קובץ השלבים');
    }
  };

  const getStaffName = (id) => {
    const person = staff.find(s => s.id === id);
    return person ? person.last_name : id;
  };

  const getStageLabel = (staffId, dateStr) => {
    const person = staff.find(s => s.id === staffId);
    if (!person || person.role !== 'מתמחה') return null;
    const [year, month] = dateStr.split('-').map(Number);
    const stage = internStages.find(s => s.staff_id === staffId && s.year === year && s.month === month);
    return stage ? stage.stage_name : null;
  };

  const isAbsentOnDay = (staffId, day) =>
    absences.some(a => a.staff_id === staffId && a.start_date <= day && a.end_date >= day);

  const isScheduledOnDay = (staffId, day) =>
    schedules.some(s => s.staff_id === staffId && s.date === day);

  const getUnscheduledForDay = (day) => {
    const unscheduled = staff.filter(s => !isScheduledOnDay(s.id, day) && !isAbsentOnDay(s.id, day));
    return {
      specialists: unscheduled.filter(s => s.role === 'מומחה'),
      interns: unscheduled.filter(s => s.role === 'מתמחה'),
      all: unscheduled
    };
  };

  const exportToExcel = () => {
    window.location.href = `/schedules/export/excel?start_date=${currentDay}&end_date=${currentDay}`;
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

  const handleDragStart = (staffId) => setDraggedStaffId(staffId);
  const handleDragOverCell = (e) => e.preventDefault();
  const handleDropOnStation = (e, day, stationId) => {
    e.preventDefault();
    if (draggedStaffId) {
      handleAddSchedule(day, stationId, draggedStaffId);
      setDraggedStaffId(null);
    }
  };

  const unscheduledForDay = getUnscheduledForDay(currentDay);

  return (
    <div style={{ maxWidth: '95%', margin: '0 auto', padding: '0 10px' }}>

      <div id="controls-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', flexWrap: 'wrap', gap: '15px' }}>
        {isAdmin && (
          <>
            <form onSubmit={handleAddStation} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="שם התחנה החדשה..." value={newStationName} onChange={(e) => setNewStationName(e.target.value)} style={{ padding: '8px', flex: '1 1 150px' }} />
              <select value={parentStationId} onChange={(e) => setParentStationId(e.target.value)} style={{ padding: '8px', flex: '1 1 150px' }}>
                <option value="">-- זוהי תחנה ראשית --</option>
                {mainStations.map(station => (<option key={station.id} value={station.id}>תת-תחנה של: {station.name}</option>))}
              </select>
              <button type="submit" style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: '1 1 100px' }}>הוסף תחנה</button>
            </form>
            <div>
              <label style={{ padding: '8px 15px', background: '#3F51B5', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                📄 העלה קובץ שלבי מתמחים
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUploadStages} style={{ display: 'none' }} />
              </label>
              {stageUploadMsg && <div style={{ fontSize: '12px', marginTop: '5px' }}>{stageUploadMsg}</div>}
            </div>
          </>
        )}

        <div id="action-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={exportToExcel} style={{ padding: '8px 15px', background: '#217346', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📊 ייצוא לאקסל</button>
          <button onClick={() => window.print()} style={{ padding: '8px 15px', background: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🖨️ הדפס PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setDayOffset(prev => prev - 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>➡️ יום קודם</button>
        <h3 style={{ margin: 0, fontSize: '1.1em', textAlign: 'center' }}>
          {new Date(currentDay + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long' })}, {formatDateToIL(currentDay)}
          {holidays[currentDay] && <div style={{ fontSize: '12px', color: 'darkblue' }}>{holidays[currentDay]}</div>}
        </h3>
        <button onClick={() => setDayOffset(prev => prev + 1)} style={{ padding: '5px 10px', cursor: 'pointer' }}>יום הבא ⬅️</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '1200px' }}>
          <thead>
            <tr style={{ background: '#3F51B5', color: 'white' }}>
              {headerGroups.map(hg => (
                <th key={hg.id} colSpan={hg.colSpan} style={{ padding: '8px', border: '1px solid #ddd' }}>{hg.name}</th>
              ))}
              <th style={{ padding: '8px', border: '1px solid #ddd', background: '#FF9800', minWidth: '110px' }}>לא משובצים - מומחים</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', background: '#FF9800', minWidth: '110px' }}>לא משובצים - מתמחים</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', background: '#F44336', minWidth: '100px' }}>היעדרויות</th>
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
            <tr>
              {displayColumns.map(station => {
                const scheduledHere = schedules.filter(s => s.date === currentDay && s.station_id === station.id);
                return (
                  <td
                    key={station.id}
                    style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top' }}
                    onDragOver={handleDragOverCell}
                    onDrop={(e) => handleDropOnStation(e, currentDay, station.id)}
                  >
                    {scheduledHere.map(s => {
                      const stage = getStageLabel(s.staff_id, currentDay);
                      return (
                        <div key={s.id} style={{ background: '#E3F2FD', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                          <span style={{ flexShrink: 1 }}>
                            {getStaffName(s.staff_id)}
                            {stage && <div style={{ fontSize: '10px', color: '#555' }}>({stage})</div>}
                          </span>
                          {isAdmin && (
                            <button onClick={() => handleDeleteSchedule(s.id)} style={{ background: 'none', border: 'none', color: '#d32f2f', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', padding: '0 3px' }} title="הסר שיבוץ">✕</button>
                          )}
                        </div>
                      );
                    })}

                    {isAdmin && (
                      <select
                        onChange={(e) => { handleAddSchedule(currentDay, station.id, e.target.value); e.target.value = ""; }}
                        style={{ width: '100%', marginTop: '5px', padding: '4px', fontSize: '12px' }}
                      >
                        <option value="">+ שבץ</option>
                        {unscheduledForDay.all.map(person => (<option key={person.id} value={person.id}>{person.last_name}</option>))}
                      </select>
                    )}
                  </td>
                );
              })}

              <td style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top', background: '#fff3e0' }}>
                {unscheduledForDay.specialists.map(person => (
                  <div
                    key={person.id}
                    draggable={isAdmin}
                    onDragStart={() => handleDragStart(person.id)}
                    style={{ background: 'white', border: '1px solid #ffcc80', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', cursor: isAdmin ? 'grab' : 'default' }}
                  >
                    {person.last_name}
                  </div>
                ))}
              </td>
              <td style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top', background: '#fff3e0' }}>
                {unscheduledForDay.interns.map(person => {
                  const stage = getStageLabel(person.id, currentDay);
                  return (
                    <div
                      key={person.id}
                      draggable={isAdmin}
                      onDragStart={() => handleDragStart(person.id)}
                      style={{ background: 'white', border: '1px solid #ffcc80', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', cursor: isAdmin ? 'grab' : 'default' }}
                    >
                      {person.last_name}
                      {stage && <div style={{ fontSize: '10px', color: '#555' }}>({stage})</div>}
                    </div>
                  );
                })}
              </td>

              <td style={{ padding: '5px', border: '1px solid #ddd', verticalAlign: 'top', background: '#ffebee' }}>
                {absences
                  .filter(a => a.start_date <= currentDay && a.end_date >= currentDay)
                  .map(absence => (
                    <div key={absence.id} style={{ background: 'white', border: '1px solid #ffcdd2', padding: '4px', borderRadius: '4px', marginBottom: '4px', fontSize: '12px', textAlign: 'right' }}>
                      <strong>{getStaffName(absence.staff_id)}</strong><br />
                      <span style={{ fontSize: '11px', color: '#c62828' }}>{absence.status_type}</span>
                    </div>
                  ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          form, button, select, #controls-panel, #action-buttons { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
          @page { size: landscape; }
        }
      `}</style>
    </div>
  );
}