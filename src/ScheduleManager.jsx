import { useState, useEffect } from 'react';
import api from './api';
import { resolveStageToStationId, getStationLabel, isNonStationStage } from './stageToStation';
import useIsMobile from './useIsMobile';
import { fetchHolidaysForDay } from './holidays';
import { StaffName } from './staffDisplay';

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
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const isMobile = useIsMobile();

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
    loadHolidays();
  }, [dayOffset]);

  const loadHolidays = async () => {
    const holiday = await fetchHolidaysForDay(currentDay);
    setHolidays(holiday ? { [currentDay]: holiday } : {});
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

  const handleClearDaySchedules = async () => {
    const daySchedules = schedules.filter((s) => s.date === currentDay);
    if (daySchedules.length === 0) {
      alert('אין שיבוצים ליום זה.');
      return;
    }
    if (!window.confirm(`למחוק את כל ${daySchedules.length} השיבוצים ליום ${formatDateToIL(currentDay)}?`)) return;

    try {
      await Promise.all(daySchedules.map((s) => api.delete(`/schedules/${s.id}`)));
      setSelectedStaffId(null);
      await fetchData();
      alert('כל השיבוצים ליום זה נמחקו.');
    } catch (error) {
      alert(error.response?.data?.detail || 'שגיאה במחיקת שיבוצים');
      fetchData();
    }
  };

  const getStationDisplayName = (station) => {
    if (station.parent_station_id) {
      const parent = stations.find((s) => s.id === station.parent_station_id);
      return parent ? `${parent.name} ${station.name}` : station.name;
    }
    return station.name;
  };

  const getStaffMember = (id) => staff.find((s) => s.id === id);

  const getStaffName = (id) => {
    const person = getStaffMember(id);
    return person ? person.last_name : id;
  };

  const assignToStation = (stationId) => {
    if (!isAdmin || !selectedStaffId) return;
    handleAddSchedule(currentDay, stationId, selectedStaffId);
    setSelectedStaffId(null);
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

  const handleAutoScheduleInterns = async () => {
    const interns = getUnscheduledForDay(currentDay).interns;
    if (interns.length === 0) {
      alert('אין מתמחים לא משובצים ליום זה.');
      return;
    }

    const preview = interns.map((person) => {
      const stage = getStageLabel(person.id, currentDay);
      const stationId = stage ? resolveStageToStationId(stage, stations) : null;
      return {
        name: `${person.first_name} ${person.last_name}`,
        stage,
        stationId,
        stationLabel: stationId ? getStationLabel(stationId, stations) : null,
      };
    });

    const schedulable = preview.filter((p) => p.stationId);
    const noStage = preview.filter((p) => !p.stage);
    const nonStation = preview.filter((p) => p.stage && isNonStationStage(p.stage));
    const unmatched = preview.filter((p) => p.stage && !isNonStationStage(p.stage) && !p.stationId);

    if (schedulable.length === 0) {
      let msg = 'לא ניתן לבצע שיבוץ אוטומטי.\n';
      if (noStage.length) msg += `\nללא שלב מוגדר: ${noStage.map((p) => p.name).join(', ')}`;
      if (nonStation.length) msg += `\nשלבים שאינם תחנה (חופש/מחלה וכו'): ${nonStation.map((p) => `${p.name} (${p.stage})`).join(', ')}`;
      if (unmatched.length) msg += `\nלא נמצאה תחנה מתאימה: ${unmatched.map((p) => `${p.name} (${p.stage})`).join(', ')}`;
      alert(msg);
      return;
    }

    const summaryLines = schedulable.map((p) => `• ${p.name} → ${p.stationLabel} (${p.stage})`);
    let confirmMsg = `שיבוץ אוטומטי ל-${schedulable.length} מתמחים:\n\n${summaryLines.join('\n')}`;
    if (noStage.length || nonStation.length || unmatched.length) {
      confirmMsg += '\n\nלא ישובצו:';
      if (noStage.length) confirmMsg += `\n• ללא שלב: ${noStage.map((p) => p.name).join(', ')}`;
      if (nonStation.length) confirmMsg += `\n• חופש/היעדרות: ${nonStation.map((p) => `${p.name} (${p.stage})`).join(', ')}`;
      if (unmatched.length) confirmMsg += `\n• תחנה לא נמצאה: ${unmatched.map((p) => `${p.name} (${p.stage})`).join(', ')}`;
    }
    if (!window.confirm(confirmMsg)) return;

    setAutoScheduling(true);
    let success = 0;
    const errors = [];

    for (const person of schedulable) {
      const intern = interns.find((i) => `${i.first_name} ${i.last_name}` === person.name);
      try {
        await api.post('/schedules/', {
          staff_id: intern.id,
          date: currentDay,
          station_id: person.stationId,
        });
        success++;
      } catch (error) {
        errors.push(`${person.name}: ${error.response?.data?.detail || error.message}`);
      }
    }

    await fetchData();
    setAutoScheduling(false);

    let resultMsg = `שובצו ${success} מתמחים בהצלחה.`;
    if (errors.length) resultMsg += `\n\nשגיאות:\n${errors.join('\n')}`;
    alert(resultMsg);
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

  const handleSelectStaff = (staffId, e) => {
    e?.stopPropagation?.();
    setSelectedStaffId((prev) => (prev === staffId ? null : staffId));
  };

  const handleAssignToStation = (stationId, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    assignToStation(stationId);
  };

  const handleDragStart = (staffId) => setSelectedStaffId(staffId);
  const handleDragOverCell = (e) => e.preventDefault();
  const handleDropOnStation = (e, day, stationId) => {
    e.preventDefault();
    if (selectedStaffId) {
      handleAddSchedule(day, stationId, selectedStaffId);
      setSelectedStaffId(null);
    }
  };

  const renderUnscheduledChip = (person, stage = null) => (
    <button
      type="button"
      key={person.id}
      draggable={isAdmin && !isMobile}
      onDragStart={() => handleDragStart(person.id)}
      onClick={isAdmin ? (e) => handleSelectStaff(person.id, e) : undefined}
      className={`unscheduled-chip${selectedStaffId === person.id ? ' selected' : ''}`}
      disabled={!isAdmin}
    >
      <StaffName person={person} as="span" />
      {stage && <span className="unscheduled-chip-stage">({stage})</span>}
    </button>
  );

  const renderStaffName = (staffId, as = 'span') => {
    const person = getStaffMember(staffId);
    return person ? <StaffName person={person} as={as} /> : <span>{staffId}</span>;
  };

  const unscheduledForDay = getUnscheduledForDay(currentDay);

  return (
    <div>
      <div className="controls-panel no-print">
        {isAdmin && (
          <div className="action-row">
            <form onSubmit={handleAddStation} className="action-row">
              <input
                type="text"
                className="form-input"
                placeholder="שם התחנה החדשה..."
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                style={{ minWidth: '150px' }}
              />
              <select className="form-select" value={parentStationId} onChange={(e) => setParentStationId(e.target.value)} style={{ minWidth: '180px' }}>
                <option value="">-- זוהי תחנה ראשית --</option>
                {mainStations.map(station => (
                  <option key={station.id} value={station.id}>תת-תחנה של: {station.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-success btn-sm">הוסף תחנה</button>
            </form>
          </div>
        )}

        <div className="action-row">
          {isAdmin && (
            <button
              onClick={handleAutoScheduleInterns}
              className="btn btn-primary btn-sm"
              disabled={autoScheduling}
            >
              {autoScheduling ? '⏳ משבץ...' : '🤖 שיבוץ אוטומטי למתמחים'}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleClearDaySchedules}
              className="btn btn-danger btn-sm"
            >
              🗑️ נקה שיבוצים ליום
            </button>
          )}
          <button onClick={exportToExcel} className="btn btn-success btn-sm">📊 ייצוא לאקסל</button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">🖨️ הדפס PDF</button>
        </div>
      </div>

      <div className="date-nav">
        <button className="btn btn-outline btn-sm" onClick={() => setDayOffset(prev => prev - 1)}>➡️ יום קודם</button>
        <div className="date-nav-label">
          {new Date(currentDay + 'T00:00:00').toLocaleDateString('he-IL', { weekday: 'long' })}, {formatDateToIL(currentDay)}
          {holidays[currentDay] && <div className="date-nav-holiday">{holidays[currentDay]}</div>}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setDayOffset(prev => prev + 1)}>יום הבא ⬅️</button>
      </div>

      {isAdmin && selectedStaffId && (
        <div className="selection-banner no-print">
          <span>
            נבחר: {renderStaffName(selectedStaffId, 'strong')}
            {isMobile ? ' — בחר תחנה מהרשימה למטה' : ' — לחץ על תחנה לשיבוץ'}
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedStaffId(null)}>
            ביטול
          </button>
        </div>
      )}

      {isAdmin && isMobile && (
        <div className="mobile-schedule-panel no-print">
          <p className="mobile-hint">לחץ על שם לבחירה, ואז בחר תחנה</p>

          <div className="mobile-unscheduled-group">
            <h4>מומחים לא משובצים ({unscheduledForDay.specialists.length})</h4>
            <div className="mobile-chip-list">
              {unscheduledForDay.specialists.length === 0 ? (
                <span className="mobile-empty">אין</span>
              ) : (
                unscheduledForDay.specialists.map((person) => renderUnscheduledChip(person))
              )}
            </div>
          </div>

          <div className="mobile-unscheduled-group">
            <h4>מתמחים לא משובצים ({unscheduledForDay.interns.length})</h4>
            <div className="mobile-chip-list">
              {unscheduledForDay.interns.length === 0 ? (
                <span className="mobile-empty">אין</span>
              ) : (
                unscheduledForDay.interns.map((person) =>
                  renderUnscheduledChip(person, getStageLabel(person.id, currentDay))
                )
              )}
            </div>
          </div>

          {selectedStaffId && (
            <div className="mobile-station-picker">
              <h4>שבץ את {getStaffName(selectedStaffId)} ל:</h4>
              <div className="station-picker-grid">
                {displayColumns.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    className="station-picker-btn"
                    onClick={() => assignToStation(station.id)}
                  >
                    {getStationDisplayName(station)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`table-wrapper${isMobile ? ' mobile-schedule-table' : ''}${isAdmin && isMobile ? ' has-mobile-panel' : ''}`}>
        <table className="schedule-table">
          <thead>
            <tr>
              {headerGroups.map(hg => (
                <th key={hg.id} colSpan={hg.colSpan} className="header-main">{hg.name}</th>
              ))}
              <th className="header-unscheduled mobile-hide-col" style={{ minWidth: '110px' }}>לא משובצים - מומחים</th>
              <th className="header-unscheduled mobile-hide-col" style={{ minWidth: '110px' }}>לא משובצים - מתמחים</th>
              <th className="header-absences" style={{ minWidth: '100px' }}>היעדרויות</th>
            </tr>
            <tr>
              {displayColumns.map(col => (
                <th key={col.id} className="header-sub">
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
                    className={isAdmin && selectedStaffId ? 'station-drop-target' : undefined}
                    onDragOver={handleDragOverCell}
                    onDrop={(e) => handleDropOnStation(e, currentDay, station.id)}
                    onClick={isAdmin && selectedStaffId ? (e) => handleAssignToStation(station.id, e) : undefined}
                  >
                    {scheduledHere.map(s => {
                      const stage = getStageLabel(s.staff_id, currentDay);
                      return (
                        <div key={s.id} className="schedule-chip">
                          <span>
                            {renderStaffName(s.staff_id)}
                            {stage && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({stage})</div>}
                          </span>
                          {isAdmin && (
                            <button type="button" className="schedule-chip-remove" onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(s.id); }} title="הסר שיבוץ">✕</button>
                          )}
                        </div>
                      );
                    })}

                    {isAdmin && (
                      <select
                        className="form-select"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { handleAddSchedule(currentDay, station.id, e.target.value); e.target.value = ""; }}
                        style={{ width: '100%', marginTop: '4px', padding: '2px', fontSize: '0.7rem' }}
                      >
                        <option value="">+ שבץ</option>
                        {unscheduledForDay.all.map(person => (
                          <option key={person.id} value={person.id}>{person.last_name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                );
              })}

              <td className="cell-unscheduled mobile-hide-col">
                {unscheduledForDay.specialists.map((person) => renderUnscheduledChip(person))}
              </td>

              <td className="cell-unscheduled mobile-hide-col">
                {unscheduledForDay.interns.map((person) =>
                  renderUnscheduledChip(person, getStageLabel(person.id, currentDay))
                )}
              </td>

              <td className="cell-absences">
                {absences
                  .filter(a => a.start_date <= currentDay && a.end_date >= currentDay)
                  .map(absence => (
                    <div key={absence.id} className="absence-chip">
                      {renderStaffName(absence.staff_id, 'strong')}<br />
                      <span style={{ fontSize: '0.65rem', color: 'var(--danger)' }}>{absence.status_type}</span>
                    </div>
                  ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
