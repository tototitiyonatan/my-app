const STAGE_PALETTE = [
  '#dbeafe', '#ffedd5', '#dcfce7', '#fce7f3', '#ede9fe',
  '#cffafe', '#fef9c3', '#fed7aa', '#e0e7ff', '#d1fae5',
  '#fbcfe8', '#bfdbfe', '#fde68a', '#bbf7d0', '#ddd6fe',
  '#a5f3fc', '#fdba74', '#c4b5fd', '#86efac', '#fca5a5',
];

const STAGE_COLORS = {
  'HRP א': '#bfdbfe',
  'HRP ב': '#93c5fd',
  'IVF': '#c4b5fd',
  'א.יום גינקולוגי': '#fbcfe8',
  'א.יום מיילדותי': '#fed7aa',
  'אוריינטציה': '#e5e7eb',
  'אחראי מיון יולדות': '#fde68a',
  'גינקואונקולוגיה': '#f9a8d4',
  'גינקולוגיה א': '#fbcfe8',
  'גינקולוגיה ב': '#f472b6',
  'חדר לידה': '#fca5a5',
  'חופש': '#f3f4f6',
  'חופשת לידה': '#e5e7eb',
  'חל"ת': '#e5e7eb',
  'יולדות': '#fdba74',
  'מדעי יסוד': '#ddd6fe',
  'מחלה': '#fecaca',
  'מחלקה': '#d1d5db',
  'מיון יולדות': '#fde047',
  'מיון נשים': '#facc15',
  'מילואים': '#cbd5e1',
  'ניצול ימי חופש': '#f3f4f6',
  'רוטציה': '#a7f3d0',
  'שלב א': '#bae6fd',
  'שלב ב': '#7dd3fc',
  'תחום גינקולוגיה': '#f9a8d4',
  'תחום מיילדות': '#fb923c',
  'תחום פוריות': '#c4b5fd',
};

export function getStageColor(stageName) {
  if (!stageName || stageName === '—') return null;

  if (STAGE_COLORS[stageName]) return STAGE_COLORS[stageName];

  let hash = 0;
  for (let i = 0; i < stageName.length; i += 1) {
    hash = stageName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STAGE_PALETTE[Math.abs(hash) % STAGE_PALETTE.length];
}

export function getStageStyle(stageName) {
  const bg = getStageColor(stageName);
  if (!bg) return {};
  return {
    backgroundColor: bg,
    color: '#1f2937',
    fontWeight: 500,
  };
}
