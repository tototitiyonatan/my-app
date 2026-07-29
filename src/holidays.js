import holidaysData from './holidaysData.json';

function appendHoliday(map, isoDate, title) {
  if (map[isoDate]) {
    if (!map[isoDate].includes(title)) {
      map[isoDate] = `${map[isoDate]}, ${title}`;
    }
  } else {
    map[isoDate] = title;
  }
}

export function fetchHolidaysForMonth(year, month) {
  const result = {};
  Object.entries(holidaysData).forEach(([isoDate, title]) => {
    const [y, m] = isoDate.split('-').map(Number);
    if (y === year && m === month) {
      appendHoliday(result, isoDate, title);
    }
  });
  return Promise.resolve(result);
}

export function fetchHolidaysForDay(isoDate) {
  return Promise.resolve(holidaysData[isoDate] || null);
}

export function holidaysByDayOfMonth(monthHolidays, year, month) {
  const byDay = {};
  Object.entries(monthHolidays).forEach(([isoDate, title]) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    if (y === year && m === month) {
      byDay[d] = title;
    }
  });
  return byDay;
}
