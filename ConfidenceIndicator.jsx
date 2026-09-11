import {
  HIGH_CONFIDENCE_THRESHOLD,
  MEDIUM_CONFIDENCE_THRESHOLD,
} from '../../utils/constants';
import { confidenceBand, percent } from '../../utils/formatters';

const NOTES = {
  high: `At or above ${Math.round(HIGH_CONFIDENCE_THRESHOLD * 100)}% — accepted into health memory.`,
  medium: `Between ${Math.round(MEDIUM_CONFIDENCE_THRESHOLD * 100)}% and ${Math.round(
    HIGH_CONFIDENCE_THRESHOLD * 100,
  )}% — needs verification if clinically important.`,
  low: `Below ${Math.round(MEDIUM_CONFIDENCE_THRESHOLD * 100)}% — high priority verification.`,
  unknown: 'No confidence score recorded.',
};

export function ConfidenceIndicator({ value, label = 'Confidence', showNote = false }) {
  const band = confidenceBand(value);
  const width = value === null || value === undefined ? 0 : Math.round(value * 100);
  return (
    <div className="confidence">
      <div className="confidence-head">
        <span className="muted">{label}</span>
        <span className="confidence-value">{percent(value)}</span>
      </div>
      <div
        className="confidence-track"
        role="meter"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percent(value)}`}
      >
        <div className={`confidence-fill ${band}`} style={{ width: `${width}%` }} />
      </div>
      {showNote && <div className="confidence-note">{NOTES[band]}</div>}
    </div>
  );
}

export default ConfidenceIndicator;
