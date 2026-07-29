export const TRAINING_OPTIONS = [
  'אחרי שלב א',
  'אחרי סבב מיון יולדות',
];

const DELIMITER = '|';

export function parseTraining(value) {
  if (!value) return [];
  return value.split(DELIMITER).filter((opt) => TRAINING_OPTIONS.includes(opt));
}

export function serializeTraining(selected) {
  const ordered = TRAINING_OPTIONS.filter((opt) => selected.includes(opt));
  return ordered.length ? ordered.join(DELIMITER) : null;
}

export function toggleTrainingOption(current, option) {
  const selected = parseTraining(current);
  const next = selected.includes(option)
    ? selected.filter((opt) => opt !== option)
    : [...selected, option];
  return serializeTraining(next);
}

export function formatTrainingDisplay(value) {
  return parseTraining(value).join(', ') || '—';
}
