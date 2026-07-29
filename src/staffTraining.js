const STORAGE_KEY = 'soroka_staff_training';

export const TRAINING_OPTIONS = [
  'אחרי שלב א',
  'אחרי סבב מיון יולדות',
];

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTraining(staffId) {
  return readAll()[staffId] || '';
}

export function setTraining(staffId, value) {
  const data = readAll();
  if (value) data[staffId] = value;
  else delete data[staffId];
  writeAll(data);
}

export function getTrainingMap() {
  return readAll();
}
