import { Badge, SourceBadge, VerificationBadge } from '../common/StatusBadge';
import { EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '../../utils/constants';
import { formatDate, percent } from '../../utils/formatters';

export function MemoryCard({ event, compact = false, onOpenDocument }) {
  const tone =
    event.verification_status === 'PENDING_VERIFICATION'
      ? 'attention'
      : event.verification_status === 'VERIFIED' ||
          event.verification_status === 'CORRECTED'
        ? 'verified'
        : event.severity === 'critical'
          ? 'critical'
          : event.severity === 'attention'
            ? 'attention'
            : '';

  const extra = event.extra || {};

  return (
    <article className={`memory-card ${tone}`}>
      <div className="memory-card-head">
        <h4>
          <span aria-hidden="true" style={{ marginRight: 8 }}>
            {EVENT_TYPE_ICONS[event.event_type] || '•'}
          </span>
          {event.title}
        </h4>
        <Badge tone="outline">
          {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
        </Badge>
      </div>

      {!compact && <div className="memory-card-body">{event.content}</div>}

      {extra.original_ocr_value && (
        <div className="alert alert-neutral mt-1" style={{ fontSize: '0.86em' }}>
          <span className="alert-icon" aria-hidden="true">
            🧾
          </span>
          <div className="alert-body">
            Original OCR: <span className="mono">“{extra.original_ocr_value}”</span>{' '}
            at {percent(extra.original_confidence)} → corrected to{' '}
            <strong>{extra.verified_value}</strong> by {extra.verified_by}.
          </div>
        </div>
      )}

      <div className="memory-card-meta">
        <span>{formatDate(event.event_date)}</span>
        <span aria-hidden="true">·</span>
        <div className="provenance">
          <SourceBadge
            sourceType={event.source_type}
            trustLevel={event.trust_level}
          />
          <VerificationBadge
            status={event.verification_status}
            confidence={event.confidence}
          />
          {event.confidence !== null && event.confidence < 1 && (
            <Badge tone="outline">{percent(event.confidence)} confidence</Badge>
          )}
        </div>
        {event.doctor_name && <span>· {event.doctor_name}</span>}
        {event.author_name && !event.doctor_name && (
          <span>· recorded by {event.author_name}</span>
        )}
        {event.document_id && onOpenDocument && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onOpenDocument(event.document_id)}
            style={{ marginLeft: 'auto' }}
          >
            View source document
          </button>
        )}
      </div>
    </article>
  );
}

export default MemoryCard;
