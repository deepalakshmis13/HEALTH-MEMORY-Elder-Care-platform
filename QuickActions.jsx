export function QuickActions({ actions = [], onPick, disabled }) {
  if (!actions.length) return null;
  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          className="chip"
          onClick={() => onPick(action)}
          disabled={disabled}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

export default QuickActions;
