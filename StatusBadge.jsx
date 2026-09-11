import {
  SOURCE_ICONS,
  SOURCE_LABELS,
  TRUST_TONE,
  VERIFICATION_LABELS,
} from '../../utils/constants';
import { percent } from '../../utils/formatters';

export function Badge({ tone = '', children, title, large = false }) {
  return (
    <span
      className={`badge ${tone ? `badge-${tone}` : ''} ${large ? 'badge-lg' : ''}`}
      title={title}
    >
      {children}
    </span>
  );
}

/** Where a record came from — never hidden, never implied (§34, §35). */
export function SourceBadge({ sourceType, trustLevel }) {
  const label = SOURCE_LABELS[sourceType] || sourceType;
  const tone = TRUST_TONE[trustLevel] || 'outline';
  return (
    <Badge tone={tone} title={trustLevel ? `Trust level: ${trustLevel}` : label}>
      <span aria-hidden="true">{SOURCE_ICONS[sourceType] || '•'}</span>
      {trustLevel || label}
    </Badge>
  );
}

export function VerificationBadge({ status, confidence }) {
  if (!status || status === 'NOT_REQUIRED') {
    return (
      <Badge tone="outline" title="Accepted directly into health memory">
        {VERIFICATION_LABELS.NOT_REQUIRED}
      </Badge>
    );
  }
  const tone =
    status === 'PENDING_VERIFICATION'
      ? 'warn'
      : status === 'REJECTED'
        ? 'danger'
        : 'ok';
  return (
    <Badge
      tone={tone}
      title={
        confidence !== undefined && confidence !== null
          ? `Confidence ${percent(confidence)}`
          : undefined
      }
    >
      {VERIFICATION_LABELS[status] || status}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  if (priority === 'HIGH') {
    return <Badge tone="danger">High priority</Badge>;
  }
  return <Badge tone="warn">Needs verification</Badge>;
}

export function SeverityDot({ severity }) {
  const map = { normal: 'ok', attention: 'warn', critical: 'danger' };
  return <Badge tone={map[severity] || 'outline'}>{severity}</Badge>;
}

export default Badge;
