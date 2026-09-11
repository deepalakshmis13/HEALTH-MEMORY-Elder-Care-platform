import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardShell from '../components/common/DashboardShell';
import { PageHeader } from '../components/common/PageHeader';
import LoadingState from '../components/common/LoadingState';
import EmptyState, { ErrorState } from '../components/common/EmptyState';
import { Badge } from '../components/common/StatusBadge';
import PatientSelector from '../components/caregiver/PatientSelector';
import PatientOverview from '../components/doctor/PatientOverview';
import VisitSummary from '../components/doctor/VisitSummary';
import ClinicalTimeline from '../components/doctor/ClinicalTimeline';
import ClinicalInsights from '../components/doctor/ClinicalInsights';
import CaregiverInsightFeed from '../components/doctor/CaregiverInsightFeed';
import DocumentUpload from '../components/health-memory/DocumentUpload';
import RoleChatbot from '../components/chatbot/RoleChatbot';
import doctorAgent from '../agents/doctorAgent';
import memoryService from '../services/memoryService';
import { doctorService } from '../services/roleServices';
import { formatDate } from '../utils/formatters';

const SECTIONS = [
  {
    items: [
      { key: 'patients', label: 'Patient Selection', icon: '👥' },
      { key: 'overview', label: 'Patient Health Overview', icon: '🩺' },
      { key: 'summary', label: 'One-click Visit Summary', icon: '📋' },
      { key: 'timeline', label: 'Clinical Timeline', icon: '🕒' },
    ],
  },
  {
    title: 'Context',
    items: [
      { key: 'caregiver', label: 'Caregiver Insight Feed', icon: '🤝' },
      { key: 'documents', label: 'Doctor Documents', icon: '📄' },
      { key: 'insights', label: 'Clinical Insights', icon: '📈' },
    ],
  },
  {
    title: 'Assistant',
    items: [{ key: 'chat', label: 'Clinical Health Memory AI', icon: '💬' }],
  },
];

export function DoctorDashboard({ user, onSignOut }) {
  const [active, setActive] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [routing, setRouting] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setState('loading');
    Promise.all([memoryService.listPatients(), doctorService.routing()])
      .then(([patientData, routingData]) => {
        setPatients(patientData.patients || []);
        setRouting(routingData.routed || []);
        if (!selectedId && patientData.patients?.length) {
          setSelectedId(patientData.patients[0].id);
        }
        setState('ready');
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!selectedId) return;
    setOverview(null);
    memoryService
      .overview(selectedId)
      .then(setOverview)
      .catch((err) => setError(err.message));
  }, [selectedId]);

  const selected = patients.find((patient) => patient.id === selectedId);
  const selectedRouting = useMemo(
    () => routing.find((item) => item.patient_id === selectedId),
    [routing, selectedId],
  );

  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.key === 'patients' ? { ...item, count: patients.length, muted: true } : item,
    ),
  }));

  return (
    <DashboardShell
      user={user}
      meta={
        user.extra?.specialty
          ? `${user.extra.specialty}${user.extra.hospital ? ` · ${user.extra.hospital}` : ''}`
          : undefined
      }
      sections={sections}
      active={active}
      onSelect={setActive}
      title="Clinical Health Memory"
      subtitle={selected ? `Viewing ${selected.full_name}` : 'Select a patient'}
      onSignOut={onSignOut}
      topbarActions={
        selected && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActive('summary')}
          >
            📋 Visit Summary
          </button>
        )
      }
    >
      {state === 'loading' && <LoadingState message="Loading your patients…" />}
      {state === 'error' && <ErrorState message={error} onRetry={load} />}

      {state === 'ready' && (
        <>
          {active === 'patients' && (
            <div className="stack">
              <PageHeader
                icon="👥"
                title="Patient Selection"
                subtitle="Only patients with an active care relationship and granted consent are listed. Records routed to you from a scanned medical record are marked."
              />

              {routing.length > 0 && (
                <section className="card">
                  <div className="card-header">
                    <h3>
                      New health memory routed to you
                      <span className="card-sub">
                        Identified from the doctor named inside a medical record
                      </span>
                    </h3>
                  </div>
                  <div className="card-body stack">
                    {routing.map((item) => (
                      <div className="memory-card" key={item.patient_id}>
                        <div className="memory-card-head">
                          <h4>{item.patient_name}</h4>
                          <Badge tone={item.consent === 'Granted' ? 'ok' : 'warn'}>
                            Consent: {item.consent}
                          </Badge>
                        </div>
                        <div className="memory-card-body">
                          {item.updates.length
                            ? item.updates
                                .map((update) => `${update.date} — ${update.title}`)
                                .join('\n')
                            : 'No updates recorded through this route yet.'}
                        </div>
                        <div className="memory-card-meta">
                          <span>Routed {formatDate(item.routed_at)}</span>
                          <Badge tone="outline">{item.relationship}</Badge>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => {
                              setSelectedId(item.patient_id);
                              setActive('overview');
                            }}
                          >
                            Open patient
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <PatientSelector
                patients={patients}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setActive('overview');
                }}
                title="Your patients"
                subtitle="Choose a patient to open their health memory"
              />
            </div>
          )}

          {active !== 'patients' && !selected && (
            <EmptyState
              icon="👥"
              title="No patient selected"
              message="Choose a patient to see their health memory."
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

          {selected && active === 'overview' && (
            <div className="stack">
              <PageHeader
                icon="🩺"
                title="Patient Health Overview"
                subtitle="Consented, provenance-carrying view of this patient's longitudinal record."
              />
              {overview ? (
                <PatientOverview
                  overview={overview}
                  access={overview.access}
                  routing={selectedRouting}
                />
              ) : (
                <LoadingState message="Retrieving clinical history…" />
              )}
            </div>
          )}

          {selected && active === 'summary' && (
            <div className="stack">
              <PageHeader
                icon="📋"
                title="One-click Visit Summary"
                subtitle={`Longitudinal summary for ${selected.full_name}, assembled from authorized health memory.`}
              />
              <VisitSummary
                patientId={selectedId}
                patientName={selected.full_name}
              />
            </div>
          )}

          {selected && active === 'timeline' && (
            <div className="stack">
              <PageHeader
                icon="🕒"
                title="Clinical Health Memory Timeline"
                subtitle="Every source, in order, with its trust level and verification status."
              />
              <ClinicalTimeline patientId={selectedId} />
            </div>
          )}

          {selected && active === 'caregiver' && (
            <div className="stack">
              <PageHeader
                icon="🤝"
                title="Caregiver Insight Feed"
                subtitle="Day-to-day observations from the caregivers and care facility."
              />
              <CaregiverInsightFeed patientId={selectedId} />
            </div>
          )}

          {selected && active === 'documents' && (
            <div className="stack">
              <PageHeader
                icon="📄"
                title="Doctor Documents"
                subtitle="Source documents behind this patient's record, with the OCR reading and confidence for each."
              />
              <DocumentUpload patientId={selectedId} />
            </div>
          )}

          {selected && active === 'insights' && (
            <div className="stack">
              <PageHeader
                icon="📈"
                title="Clinical Insights"
                subtitle="Patterns across the last 90 days of this patient's health memory."
              />
              <ClinicalInsights patientId={selectedId} />
            </div>
          )}

          {selected && active === 'chat' && (
            <div className="stack">
              <PageHeader
                icon="💬"
                title="Clinical Health Memory Assistant"
                subtitle="Consent-filtered retrieval over this patient's record. Every answer carries its evidence."
              />
              <RoleChatbot
                agent={doctorAgent}
                patientId={selectedId}
                patientName={selected.full_name}
              />
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}

export default DoctorDashboard;
