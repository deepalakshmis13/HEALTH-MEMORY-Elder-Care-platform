import { Badge } from '../common/StatusBadge';

export function ShiftSelector({ shifts = [], value, onChange, activeShift }) {
  return (
    <section className="card">
      <div className="card-header">
        <h3>
          Shift Management
          <span className="card-sub">
            Shift times are configurable in the platform settings
          </span>
        </h3>
        {activeShift && (
          <Badge tone="ok">
            Active: {activeShift.shift_code} · {activeShift.start_time}–
            {activeShift.end_time}
          </Badge>
        )}
      </div>
      <div className="card-body">
        <div className="radio-group">
          {shifts.map((shift) => (
            <label
              key={shift.id}
              className={`radio-option${value === shift.id ? ' selected' : ''}`}
            >
              <input
                type="radio"
                name="shift"
                checked={value === shift.id}
                onChange={() => onChange(shift.id)}
              />
              <span>
                <span className="opt-title">{shift.label}</span>
                <span className="opt-sub">
                  {shift.start} – {shift.end}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ShiftSelector;
