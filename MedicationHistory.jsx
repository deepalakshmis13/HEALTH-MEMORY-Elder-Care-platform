import MemoryCard from '../health-memory/MemoryCard';
import EmptyState from '../common/EmptyState';
import { SectionCard } from '../common/PageHeader';

export function MedicationHistory({ events = [] }) {
  return (
    <SectionCard
      title="Medication History"
      subtitle="Every medication event in this patient's health memory, newest first"
    >
      {events.length === 0 ? (
        <EmptyState
          icon="🕒"
          title="No medication history"
          message="Prescriptions, changes and administrations appear here as they are recorded."
        />
      ) : (
        <div className="stack">
          {events.map((event) => (
            <MemoryCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default MedicationHistory;
