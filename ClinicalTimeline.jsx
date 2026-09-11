import MemoryTimeline from '../health-memory/MemoryTimeline';

export function ClinicalTimeline({ patientId, refreshKey, onOpenDocument }) {
  return (
    <MemoryTimeline
      patientId={patientId}
      title="Clinical Health Memory Timeline"
      subtitle="Longitudinal record across every source, with provenance and verification status"
      refreshKey={refreshKey}
      onOpenDocument={onOpenDocument}
    />
  );
}

export default ClinicalTimeline;
