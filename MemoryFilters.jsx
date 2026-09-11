import { EVENT_TYPE_LABELS, SOURCE_LABELS } from '../../utils/constants';

const QUICK_TYPES = [
  'MEDICATION',
  'MEDICATION_CHANGE',
  'CONSULTATION',
  'SYMPTOM',
  'LAB_RESULT',
  'OBSERVATION',
  'DOCUMENT',
  'VOICE_ENTRY',
];

export function MemoryFilters({ value, onChange, showSources = true }) {
  const update = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="stack">
      <div className="row">
        <input
          type="search"
          value={value.search || ''}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Search health memory…"
          aria-label="Search health memory"
          style={{ maxWidth: 320 }}
        />
        <select
          value={value.days || ''}
          onChange={(event) => update({ days: event.target.value })}
          aria-label="Time range"
          style={{ maxWidth: 190 }}
        >
          <option value="">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value="365">Last year</option>
        </select>
        {showSources && (
          <select
            value={value.source_types || ''}
            onChange={(event) => update({ source_types: event.target.value })}
            aria-label="Source"
            style={{ maxWidth: 220 }}
          >
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        )}
        {(value.search || value.days || value.source_types || value.event_types) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              onChange({ search: '', days: '', source_types: '', event_types: '' })
            }
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="row tight">
        <button
          type="button"
          className={`chip${!value.event_types ? ' active' : ''}`}
          onClick={() => update({ event_types: '' })}
        >
          Everything
        </button>
        {QUICK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`chip${value.event_types === type ? ' active' : ''}`}
            onClick={() =>
              update({ event_types: value.event_types === type ? '' : type })
            }
          >
            {EVENT_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MemoryFilters;
