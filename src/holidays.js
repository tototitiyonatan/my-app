const BEERSHEBA_GEONAME = 293397;

const ISLAMIC_HOLIDAYS = [
  'Eid al-Fitr',
  'Eid al-Adha',
  'Laylat al-Qadr',
  'Muharram',
  'Mawlid al-Nabi',
  'Islamic New Year',
  "Lailat al Miraj",
  "Lailat al Bara'at",
];

const SKIP_HEBREW = /^(Candle lighting|Havdalah)/i;

function appendHoliday(map, key, title) {
  map[key] = map[key] ? `${map[key]}, ${title}` : title;
}

async function fetchHebrewHolidays(year, month) {
  const map = {};
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&i=on&geo=geoname&geonameid=${BEERSHEBA_GEONAME}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items) return map;

    data.items.forEach((event) => {
      if (SKIP_HEBREW.test(event.title)) return;
      const isoDate = event.date.slice(0, 10);
      appendHoliday(map, isoDate, event.title);
    });
  } catch (error) {
    console.error('Error fetching Hebrew holidays:', error);
  }

  return map;
}

async function fetchIslamicHolidays(year, month) {
  const map = {};

  try {
    const response = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
    const data = await response.json();
    if (!data.data) return map;

    data.data.forEach((entry) => {
      const holidays = entry.hijri?.holidays || [];
      const relevant = holidays.filter((name) =>
        ISLAMIC_HOLIDAYS.some((mh) => name.includes(mh))
      );
      if (relevant.length === 0) return;

      const [day, mon, yr] = entry.gregorian.date.split('-');
      const isoDate = `${yr}-${mon}-${day}`;
      relevant.forEach((name) => appendHoliday(map, isoDate, name));
    });
  } catch (error) {
    console.error('Error fetching Islamic holidays:', error);
  }

  return map;
}

export async function fetchHolidaysForMonth(year, month) {
  const [hebrew, islamic] = await Promise.all([
    fetchHebrewHolidays(year, month),
    fetchIslamicHolidays(year, month),
  ]);

  const merged = { ...hebrew };
  Object.entries(islamic).forEach(([date, title]) => {
    appendHoliday(merged, date, title);
  });
  return merged;
}

export async function fetchHolidaysForDay(isoDate) {
  const [year, month] = isoDate.split('-').map(Number);
  const monthHolidays = await fetchHolidaysForMonth(year, month);
  return monthHolidays[isoDate] || null;
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
