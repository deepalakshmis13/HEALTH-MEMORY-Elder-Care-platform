export function EmptyState({
  icon = '🗂',
  title = 'Nothing here yet',
  message,
  action,
}) {
  return (
    <div className="empty-state">
      <span className="es-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="es-title">{title}</div>
      {message && <p className="es-sub">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state">
      <span className="es-icon" aria-hidden="true">
        ⚠️
      </span>
      <div className="es-title">Unable to load this section</div>
      <p className="es-sub">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export default EmptyState;
