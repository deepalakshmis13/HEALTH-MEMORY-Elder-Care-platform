import { useCallback, useEffect, useState } from 'react';
import DashboardShell from '../components/common/DashboardShell';
import { PageHeader } from '../components/common/PageHeader';
import LoadingState from '../components/common/LoadingState';
import EmptyState, { ErrorState } from '../components/common/EmptyState';
import PatientSelector from '../components/caregiver/PatientSelector';
import VerificationQueue from '../components/pharmacist/VerificationQueue';
import OCRVerification from '../components/pharmacist/OCRVerification';
import MedicationOverview from '../components/pharmacist/MedicationOverview';
import MedicationHistory from '../components/pharmacist/MedicationHistory';
import MedicationInsights from '../components/pharmacist/MedicationInsights';
import RoleChatbot from '../components/chatbot/RoleChatbot';
import pharmacistAgent from '../agents/pharmacistAgent';
import { useToast } from '../components/common/Toast';
import { pharmacistService } from '../services/roleServices';

const SECTIONS = [
  {
    items: [
      { key: 'queue', label: 'Verification Queue', icon: '📥' },
      { key: 'lowconf', label: 'Low-Confidence Review', icon: '🔍' },
    ],
  },
  {
    title: 'Patient medication',
    items: [
      { key: 'patients', label: 'Patients', icon: '👥' },
      { key: 'medications', label: 'Medication Overview', icon: '💊' },
      { key: 'history', label: 'Medication History', icon: '🕒' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { key: 'insights', label: 'Medication Insights', icon: '📈' },
      { key: 'chat', label: 'Medication Memory AI', icon: '💬' },
    ],
  },
];

export function PharmacistDashboard({ user, onSignOut }) {
  const toast = useToast();
  const [active, setActive] = useState('queue');
  const [status, setStatus] = useState('PENDING_VERIFICATION');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ pending: 0, high_priority: 0 });
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);

  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [medications, setMedications] = useState(null);

  const loadQueue = useCallback(() => {
    setState('loading');
    pharmacistService
      .queue(status)
      .then((data) => {
        setQueue(data.queue || []);
        setStats(data.stats || {});
        setState('ready');
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
  }, [status]);

  useEffect(loadQueue, [loadQueue]);

  useEffect(() => {
    pharmacistService
      .patients()
      .then((data) => {
        setPatients(data.patients || []);
        if (!selectedId && data.patients?.length) setSelectedId(data.patients[0].id);
      })
      .catch(() => setPatients([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setMedications(null);
    pharmacistService
      .medications(selectedId)
      .then(setMedications)
      .catch((err) => toast.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const lowConfidence = queue.filter((item) => item.priority === 'HIGH');
  const selected = patients.find((patient) => patient.id === selectedId);

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.key === 'queue' && stats.pending) return { ...item, count: stats.pending };
      if (item.key === 'lowconf' && stats.high_priority) {
        return { ...item, count: stats.high_priority };
      }
      return item;
    }),
  }));

  const refreshAll = () => {
    loadQueue();
    if (selectedId) {
      pharmacistService.medications(selectedId).then(setMedications).catch(() => {});
    }
  };

  return (
    <DashboardShell
      user={user}
      meta={user.extra?.pharmacy_name}
      sections={sections}
      active={active}
      onSelect={setActive}
      title="Medication Verification"
      subtitle={`${stats.pending || 0} pending · ${stats.high_priority || 0} high priority`}
      onSignOut={onSignOut}
    >
      {active === 'queue' && (
        <div className="stack">
          <PageHeader
            icon="📥"
            title="Verification Queue"
            subtitle="You do not receive every medical record. Only clinically important fields read below the auto-accept threshold — medication names, doses, frequencies, prescription instructions, medication changes, allergies and critical instructions — arrive here."
          />
          {state === 'loading' && <LoadingState message="Loading the queue…" />}
          {state === 'error' && <ErrorState message={error} onRetry={loadQueue} />}
          {state === 'ready' && (
            <VerificationQueue
              queue={queue}
              status={status}
              onStatus={setStatus}
              onOpen={(item) => setTaskId(item.id)}
            />
          )}
        </div>
      )}

      {active === 'lowconf' && (
        <div className="stack">
          <PageHeader
            icon="🔍"
            title="Low-Confidence Medical Data Review"
            subtitle="Readings below 60% confidence. These are the highest-risk extractions in the system — a misread dose or drug name would otherwise flow straight into the patient's health memory."
          />
          {lowConfidence.length === 0 ? (
            <EmptyState
              icon="🟢"
              title="No high-priority items"
              message="Nothing is currently below the low-confidence threshold."
            />
          ) : (
            <VerificationQueue
              queue={lowConfidence}
              status={status}
              onStatus={setStatus}
              onOpen={(item) => setTaskId(item.id)}
            />
          )}
        </div>
      )}

      {active === 'patients' && (
        <div className="stack">
          <PageHeader
            icon="👥"
            title="Patients"
            subtitle="Patients who have granted medication consent to pharmacists, or who have work in the verification queue."
          />
          <PatientSelector
            patients={patients}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setActive('medications');
            }}
            title="Select a patient"
          />
        </div>
      )}

      {active === 'medications' && (
        <div className="stack">
          <PageHeader
            icon="💊"
            title="Medication Overview"
            subtitle={
              selected
                ? `Complete medication record for ${selected.full_name}, with source and verification status.`
                : 'Select a patient to view their medication record.'
            }
          />
          {!selected && (
            <EmptyState
              icon="👥"
              title="No patient selected"
              action={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActive('patients')}
                >
                  Select a patient
                </button>
              }
            />
          )}
          {selected && !medications && <LoadingState message="Loading medications…" />}
          {selected && medications && <MedicationOverview data={medications} />}
        </div>
      )}

      {active === 'history' && (
        <div className="stack">
          <PageHeader
            icon="🕒"
            title="Medication History"
            subtitle={
              selected
                ? `Every medication event recorded for ${selected.full_name}.`
                : 'Select a patient first.'
            }
          />
          {selected && !medications && <LoadingState message="Loading history…" />}
          {selected && medications && (
            <MedicationHistory events={medications.medication_history} />
          )}
        </div>
      )}

      {active === 'insights' && (
        <div className="stack">
          <PageHeader
            icon="📈"
            title="Medication Insights"
            subtitle="How much verification work the pipeline is creating, and where it comes from."
          />
          <MedicationInsights />
        </div>
      )}

      {active === 'chat' && (
        <div className="stack">
          <PageHeader
            icon="💬"
            title="Medication Memory Assistant"
            subtitle="Medication-focused retrieval with direct access to the verification queue and OCR readings."
          />
          {selected ? (
            <RoleChatbot
              agent={pharmacistAgent}
              patientId={selectedId}
              patientName={selected.full_name}
            />
          ) : (
            <EmptyState
              icon="👥"
              title="Select a patient"
              message="The assistant answers about one patient's medication memory at a time."
              action={
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActive('patients')}
                >
                  Select a patient
                </button>
              }
            />
          )}
        </div>
      )}

      <OCRVerification
        taskId={taskId}
        open={Boolean(taskId)}
        onClose={() => setTaskId(null)}
        onResolved={refreshAll}
      />
    </DashboardShell>
  );
}

export default PharmacistDashboard;
