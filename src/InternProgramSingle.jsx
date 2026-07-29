import { useState, useEffect } from 'react';
import api from './api';
import { StaffName } from './staffDisplay';
import { getStageStyle } from './stageColors';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export default function InternProgramSingle({ staff, onClose }) {
  const [internStages, setInternStages] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await api.get('/intern-stages/');
        setInternStages(res.data);
      } catch (error) {
        console.error('שגיאה בשליפת תוכנית התמחות:', error);
      }
    };
    fetchStages();
  }, []);

  const getStage = (month) => {
    const stage = internStages.find(
      (s) => s.staff_id === staff.id && s.year === year && s.month === month
    );
    return stage?.stage_name || '';
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="intern-modal">
      <div className="intern-modal-header">
        <h3>
          תוכנית התמחות — <StaffName person={staff} as="span" />
        </h3>
        <div className="action-row">
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table internship-table">
          <thead>
            <tr>
              {months.map((month) => (
                <th key={month}>{MONTH_NAMES[month - 1]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {months.map((month) => {
                const stage = getStage(month);
                return (
                  <td key={month} style={getStageStyle(stage)}>
                    {stage || '—'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
