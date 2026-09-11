import { SCOPE_DESCRIPTIONS, SCOPE_LABELS } from '../../utils/permissions';

export function ConsentCard({ role, scopes, matrix, onToggle, busyKey, readOnly }) {
  return (
    <section className="card">
      <div className="card-header">
        <h3>
          {role.label}
          <span className="card-sub">
            What people in this role can see in this health memory
          </span>
        </h3>
      </div>
      <div className="card-body stack">
        {scopes.map((scope) => {
          const entry = matrix?.[scope.key];
          const granted = Boolean(entry?.granted);
          const key = `${role.key}:${scope.key}`;
          return (
            <div className="row between" key={scope.key}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="strong">
                  {SCOPE_LABELS[scope.key] || scope.label}
                </div>
                <div className="small muted">
                  {SCOPE_DESCRIPTIONS[scope.key] || ''}
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={granted}
                  disabled={readOnly || busyKey === key}
                  onChange={(event) =>
                    onToggle(role.key, scope.key, event.target.checked)
                  }
                  aria-label={`${granted ? 'Revoke' : 'Grant'} ${
                    SCOPE_LABELS[scope.key] || scope.label
                  } for ${role.label}`}
                />
                <span className="slider" />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ConsentCard;
