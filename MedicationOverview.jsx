import { Badge, VerificationBadge } from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { SectionCard } from '../common/PageHeader';
import { formatDate, percent } from '../../utils/formatters';
import { SOURCE_LABELS } from '../../utils/constants';

export function MedicationOverview({ data }) {
  if (!data) return null;
  const active = data.medications.filter((item) => item.status === 'ACTIVE');
  const stopped = data.medications.filter((item) => item.status !== 'ACTIVE');

  return (
    <div className="stack">
      <SectionCard
        title={`Current medications — ${data.patient.full_name}`}
        subtitle="Source and verification status for every entry"
        flush
      >
        {active.length === 0 ? (
          <EmptyState
            icon="💊"
            title="No active medications"
            message="Nothing is currently recorded as active for this patient."
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dose</th>
                  <th>Frequency</th>
                  <th>Prescriber</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {active.map((medication) => (
                  <tr key={medication.id}>
                    <td className="strong">{medication.name}</td>
                    <td>{medication.dose || '—'}</td>
                    <td>{medication.frequency || '—'}</td>
                    <td className="small muted">{medication.prescriber || '—'}</td>
                    <td className="small">
                      {SOURCE_LABELS[medication.source_type] || medication.source_type}
                      <div className="tiny faint">
                        {medication.confidence_percent} confidence
                      </div>
                    </td>
                    <td>
                      <VerificationBadge
                        status={medication.verification_status}
                        confidence={medication.confidence}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {stopped.length > 0 && (
        <SectionCard title="Stopped or changed" flush>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dose</th>
                  <th>Started</th>
                  <th>Stopped</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stopped.map((medication) => (
                  <tr key={medication.id}>
                    <td className="strong">{medication.name}</td>
                    <td>{medication.dose || '—'}</td>
                    <td className="small muted">{formatDate(medication.started_on)}</td>
                    <td className="small muted">
                      {medication.stopped_on ? formatDate(medication.stopped_on) : '—'}
                    </td>
                    <td>
                      <Badge tone="outline">{medication.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Prescription History"
        subtitle="Every prescription source, with the confidence of each extracted item"
      >
        {data.prescriptions.length === 0 ? (
          <p className="muted">No prescriptions recorded.</p>
        ) : (
          <div className="stack">
            {data.prescriptions.map((prescription) => (
              <div className="memory-card" key={prescription.id}>
                <div className="memory-card-head">
                  <h4>{prescription.issued_on_label}</h4>
                  <VerificationBadge status={prescription.verification_status} />
                </div>
                <div className="stack" style={{ gap: 4 }}>
                  {(prescription.items || []).map((item, index) => (
                    <div className="row tight small" key={index}>
                      <span className="strong">{item.name}</span>
                      {item.dose && <span>· {item.dose}</span>}
                      {item.frequency && <span>· {item.frequency}</span>}
                      {item.instruction && (
                        <span className="muted">· {item.instruction}</span>
                      )}
                      <Badge tone="outline">{percent(item.confidence)}</Badge>
                    </div>
                  ))}
                </div>
                <div className="memory-card-meta">
                  <Badge tone="outline">
                    {SOURCE_LABELS[prescription.source_type] || prescription.source_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default MedicationOverview;
