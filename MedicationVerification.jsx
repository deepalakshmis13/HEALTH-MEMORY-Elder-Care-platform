import { useState } from 'react';
import { Badge, VerificationBadge } from '../common/StatusBadge';
import Modal from '../common/Modal';
import EmptyState from '../common/EmptyState';
import { useToast } from '../common/Toast';
import { caregiverService } from '../../services/roleServices';

const STATUS_TONES = {
  Administered: 'ok',
  Pending: 'outline',
  Missed: 'danger',
  Skipped: 'warn',
  Delayed: 'warn',
  'Needs Attention': 'danger',
};

/** Medication administration record — becomes persistent health memory (§27). */
export function MedicationVerification({ patient, administrations = [], onDone }) {
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState('Administered');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (item) => {
    setTarget(item);
    setStatus(
      item.verification_status === 'PENDING_VERIFICATION' ? 'Needs Attention' : 'Administered',
    );
    setNotes('');
  };

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const result = await caregiverService.verifyMedication({
        administration_id: target.id,
        status,
        notes: notes || null,
      });
      toast.success(result.message, `${target.medication} recorded`);
      setTarget(null);
      onDone?.();
    } catch (error) {
      toast.error(error.message, 'Not recorded');
    } finally {
      setBusy(false);
    }
  };

  if (!administrations.length) {
    return (
      <EmptyState
        icon="💊"
        title="No medication scheduled in this shift"
        message="Doses fall into a shift based on their scheduled times. Nothing is due for this resident during these hours."
      />
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Time</th>
              <th>Medication</th>
              <th>Dose</th>
              <th>Prescriber</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {administrations.map((item) => (
              <tr key={item.id}>
                <td className="strong nowrap">{item.scheduled_time}</td>
                <td>
                  <div className="strong">{item.medication}</div>
                  {item.verification_status === 'PENDING_VERIFICATION' && (
                    <VerificationBadge status={item.verification_status} />
                  )}
                </td>
                <td>
                  {item.dose || '—'}
                  <div className="tiny faint">{item.frequency}</div>
                </td>
                <td className="small muted">{item.prescriber || '—'}</td>
                <td>
                  <Badge tone={STATUS_TONES[item.status] || 'outline'}>
                    {item.status}
                  </Badge>
                  {item.notes && <div className="tiny faint">{item.notes}</div>}
                </td>
                <td className="right">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => open(item)}
                  >
                    Verify Administration
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(target)}
        title={`Verify administration — ${target?.medication || ''}`}
        onClose={() => setTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={busy}
            >
              {busy ? 'Recording…' : 'Record in health memory'}
            </button>
          </>
        }
      >
        {target?.verification_status === 'PENDING_VERIFICATION' && (
          <div className="alert alert-danger mb-2">
            <span className="alert-icon" aria-hidden="true">
              ⛔
            </span>
            <div className="alert-body">
              <div className="alert-title">Do not administer</div>
              This medication came from a low-confidence document reading and is
              still awaiting pharmacist verification. It cannot be recorded as
              administered.
            </div>
          </div>
        )}

        <div className="kv-list mb-2">
          <div className="kv">
            <span className="kv-key">Patient</span>
            <span className="kv-val">{patient?.full_name}</span>
          </div>
          <div className="kv">
            <span className="kv-key">Medication</span>
            <span className="kv-val">
              {target?.medication} {target?.dose}
            </span>
          </div>
          <div className="kv">
            <span className="kv-key">Scheduled</span>
            <span className="kv-val">{target?.scheduled_time}</span>
          </div>
          <div className="kv">
            <span className="kv-key">Prescriber</span>
            <span className="kv-val">{target?.prescriber || 'not recorded'}</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="admin-status">Status</label>
          <select
            id="admin-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {['Administered', 'Missed', 'Skipped', 'Delayed', 'Needs Attention'].map(
              (option) => (
                <option key={option}>{option}</option>
              ),
            )}
          </select>
        </div>

        <div className="field">
          <label htmlFor="admin-notes">Notes (optional)</label>
          <textarea
            id="admin-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="e.g. taken with breakfast, refused, or vomited afterwards"
          />
        </div>

        <p className="tiny faint">
          This is written to the patient's health memory as a caregiver-recorded
          event, with your name, the shift and the time.
        </p>
      </Modal>
    </>
  );
}

export default MedicationVerification;
