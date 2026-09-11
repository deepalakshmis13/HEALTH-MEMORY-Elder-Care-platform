import { formatDateTime } from '../../utils/formatters';

export function EmergencyCard({ card, compact = false }) {
  if (!card) return null;

  return (
    <div className="emergency-card">
      <div className="emergency-head">
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>
          🚨
        </span>
        <div style={{ flex: 1 }}>
          <h2>Emergency Health Card</h2>
          <div className="small" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Show this to any medical professional
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-cell">
          <div className="ec-label">Patient</div>
          <div className="ec-value">{card.patient_name}</div>
        </div>
        <div className="emergency-cell">
          <div className="ec-label">Age</div>
          <div className="ec-value">{card.age ?? '—'}</div>
        </div>
        <div className="emergency-cell critical">
          <div className="ec-label">Blood group</div>
          <div className="ec-value">{card.blood_group || 'Not recorded'}</div>
        </div>
        {card.room_number && (
          <div className="emergency-cell">
            <div className="ec-label">Room</div>
            <div className="ec-value">{card.room_number}</div>
          </div>
        )}
      </div>

      <div className="emergency-grid">
        <div className="emergency-cell critical" style={{ gridColumn: '1 / -1' }}>
          <div className="ec-label">Allergies</div>
          <div className="ec-value">
            {card.allergies?.length
              ? card.allergies
                  .map((allergy) =>
                    allergy.reaction
                      ? `${allergy.substance} (${allergy.reaction})`
                      : allergy.substance,
                  )
                  .join(' · ')
              : 'None recorded'}
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-cell" style={{ gridColumn: '1 / -1' }}>
          <div className="ec-label">Critical conditions</div>
          <div className="ec-value">
            {card.critical_conditions?.length
              ? card.critical_conditions
                  .map((condition) => condition.name)
                  .join(' · ')
              : 'None recorded'}
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-cell" style={{ gridColumn: '1 / -1' }}>
          <div className="ec-label">Critical medications</div>
          <div className="ec-value" style={{ fontSize: '1em', lineHeight: 1.7 }}>
            {card.critical_medications?.length
              ? card.critical_medications
                  .map((medication) =>
                    [medication.name, medication.dose, medication.frequency]
                      .filter(Boolean)
                      .join(' '),
                  )
                  .join(' · ')
              : 'None recorded'}
          </div>
        </div>
      </div>

      <div className="emergency-grid">
        <div className="emergency-cell">
          <div className="ec-label">Emergency contact</div>
          <div className="ec-value">
            {card.emergency_contact?.name || 'Not recorded'}
          </div>
          <div className="small muted">
            {card.emergency_contact?.relation}{' '}
            {card.emergency_contact?.phone
              ? `· ${card.emergency_contact.phone}`
              : ''}
          </div>
        </div>
        <div className="emergency-cell">
          <div className="ec-label">Primary doctor</div>
          <div className="ec-value">{card.primary_doctor?.name || 'Not recorded'}</div>
          <div className="small muted">
            {card.primary_doctor?.specialty}{' '}
            {card.primary_doctor?.phone ? `· ${card.primary_doctor.phone}` : ''}
          </div>
        </div>
        {card.facility && (
          <div className="emergency-cell">
            <div className="ec-label">Care facility</div>
            <div className="ec-value">{card.facility.name}</div>
            <div className="small muted">{card.facility.phone}</div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="card-footer">
          <span className="tiny faint">
            Generated {formatDateTime(card.generated_at)} from verified health
            memory. Medication still awaiting verification is not listed here.
          </span>
        </div>
      )}
    </div>
  );
}

export default EmergencyCard;
