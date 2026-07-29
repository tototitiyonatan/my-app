const NON_STATION_STAGES = new Set([
  'אוריינטציה',
  'חופש',
  'חופשת לידה',
  'חל"ת',
  'חל״ת',
  'מחלה',
  'מילואים',
  'ניצול ימי חופש',
  'מדעי יסוד',
  'שלב א',
  'שלב ב',
  'מחלקה',
]);

const STAGE_ALIASES = {
  'גינקולוגיה א': 'גניקולוגיה א',
  'גינקולוגיה ב': 'גניקולוגיה ב',
  'גינקואונקולוגיה': 'אונקולוגיה',
  'מיון יולדות': 'מיון נשים',
  'אחראי מיון יולדות': 'מיון נשים',
  'א.יום מיילדותי': 'אשפוז יום מיילדותי',
  'א.יום גינקולוגי': 'אשפוז יום גניקולוגי',
  'תחום גינקולוגיה': 'גניקולוגיה',
  'תחום מיילדות': 'יולדות',
  'תחום פוריות': 'IVF',
};

function buildStationIndex(stations) {
  const mains = stations.filter((s) => s.parent_station_id === null);
  const subsByParent = {};

  stations
    .filter((s) => s.parent_station_id)
    .forEach((s) => {
      if (!subsByParent[s.parent_station_id]) subsByParent[s.parent_station_id] = [];
      subsByParent[s.parent_station_id].push(s);
    });

  return { mains, subsByParent };
}

export function resolveStageToStationId(stageName, stations) {
  if (!stageName || !stations.length) return null;

  const trimmed = stageName.trim();
  const normalized = STAGE_ALIASES[trimmed] || trimmed;

  if (NON_STATION_STAGES.has(normalized)) return null;

  const { mains, subsByParent } = buildStationIndex(stations);

  const standalone = mains.find(
    (m) => m.name === normalized && !(subsByParent[m.id]?.length)
  );
  if (standalone) return standalone.id;

  const parts = normalized.split(/\s+/);
  if (parts.length >= 2) {
    const subName = parts[parts.length - 1];
    const parentName = parts.slice(0, -1).join(' ');
    const parent = mains.find((m) => m.name === parentName);
    if (parent && subsByParent[parent.id]) {
      const sub = subsByParent[parent.id].find((s) => s.name === subName);
      if (sub) return sub.id;
    }
  }

  const parentOnly = mains.find((m) => m.name === normalized);
  if (parentOnly && subsByParent[parentOnly.id]?.length) {
    const subs = [...subsByParent[parentOnly.id]].sort((a, b) =>
      a.name.localeCompare(b.name, 'he')
    );
    return subs[0].id;
  }

  const directMatch = stations.find((s) => s.name === normalized);
  if (directMatch) return directMatch.id;

  return null;
}

export function getStationLabel(stationId, stations) {
  const station = stations.find((s) => s.id === stationId);
  if (!station) return '';

  if (station.parent_station_id) {
    const parent = stations.find((s) => s.id === station.parent_station_id);
    return parent ? `${parent.name} ${station.name}` : station.name;
  }

  return station.name;
}

export function isNonStationStage(stageName) {
  if (!stageName) return true;
  const normalized = STAGE_ALIASES[stageName.trim()] || stageName.trim();
  return NON_STATION_STAGES.has(normalized);
}
