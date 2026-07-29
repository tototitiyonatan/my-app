import { TRAINING_OPTIONS, parseTraining, toggleTrainingOption } from './staffTraining';

export default function TrainingSelector({ value, onChange, compact = false }) {
  const selected = parseTraining(value);

  const handleToggle = (option) => {
    onChange(toggleTrainingOption(value, option) || '');
  };

  return (
    <div className={`training-selector${compact ? ' training-selector-compact' : ''}`}>
      {TRAINING_OPTIONS.map((option) => (
        <label key={option} className="training-option">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => handleToggle(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
