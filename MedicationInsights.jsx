import { useEffect, useState } from 'react';
import StatCard from '../common/StatCard';
import { Badge } from '../common/StatusBadge';
import { SectionCard } from '../common/PageHeader';
import LoadingState from '../common/LoadingState';
import { ErrorState } from '../common/EmptyState';
import ConfidenceIndicator from '../ingestion/ConfidenceIndicator';
import { pharmacistService } from '../../services/roleServices';
import { formatDateTime } from '../../utils/formatters';

export function MedicationInsights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    pharmacistService
      .insights()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState message="Calculating confidence…" />;

  const maxField = Math.max(1, ...Object.values(data.tasks_by_field || {}));

  return (
    <div className="stack">
      <div className="grid grid-4">
        <StatCard
          icon="📥"
          label="Pending"
          value={data.stats.pending}
          tone={data.stats.pending ? 'warn' : 'ok'}
          hint={`${data.stats.high_priority} high priority`}
        />
        <StatCard icon="✅" label="Verified" value={data.stats.verified} tone="ok" />
        <StatCard
          icon="✏️"
          label="Corrected"
          value={data.stats.corrected}
          tone="info"
          hint={
            data.correction_rate !== null
              ? `${Math.round(data.correction_rate * 100)}% of all tasks`
              : ''
          }
        />
        <StatCard
          icon="⛔"
          label="Rejected"
          value={data.stats.rejected}
          tone="danger"
        />
      </div>

      <div className="grid grid-2">
        <SectionCard
          title="Average OCR confidence"
          subtitle="Why handwriting creates most of the verification work"
        >
          <div className="stack">
            <ConfidenceIndicator
              value={data.average_confidence.printed_documents}
              label={`Printed documents (${data.document_counts.printed})`}
            />
            <ConfidenceIndicator
              value={data.average_confidence.handwritten_documents}
              label={`Handwritten documents (${data.document_counts.handwritten})`}
            />
            <ConfidenceIndicator
              value={data.average_confidence.flagged_fields}
              label="Fields that reached this queue"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="What gets flagged"
          subtitle="Verification tasks by field type"
        >
          <div className="stack">
            {Object.entries(data.tasks_by_field || {})
              .sort((a, b) => b[1] - a[1])
              .map(([field, count]) => (
                <div key={field}>
                  <div className="row between small">
                    <span>{field}</span>
                    <span className="strong">{count}</span>
                  </div>
                  <div className="confidence-track">
                    <div
                      className="confidence-fill medium"
                      style={{ width: `${(count / maxField) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(data.tasks_by_field || {}).length === 0 && (
              <p className="muted">No verification tasks have been created yet.</p>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Queue health">
        <div className="row">
          <Badge tone="outline" large>
            {data.stats.total} tasks in total
          </Badge>
          <Badge tone={data.stats.pending ? 'warn' : 'ok'} large>
            {data.patients_with_pending.length} patient(s) waiting
          </Badge>
          {data.oldest_pending && (
            <Badge tone="outline" large>
              Oldest pending since {formatDateTime(data.oldest_pending)}
            </Badge>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default MedicationInsights;
