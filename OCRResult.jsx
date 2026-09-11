import ConfidenceIndicator from './ConfidenceIndicator';
import { Badge, PriorityBadge } from '../common/StatusBadge';
import { percent, truncate } from '../../utils/formatters';

/** The OCR read-out shown right after a document is processed (§10, §11). */
export function OCRResult({ result, routing, onDone, onViewQueue }) {
  if (!result) return null;
  const { ocr } = result;
  const flagged = (ocr.fields || []).filter((field) => field.needs_verification);
  const accepted = (ocr.fields || []).filter((field) => !field.needs_verification);

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <h3>
            {ocr.document_type_label}
            <span className="card-sub">
              {result.document.filename} · engine {ocr.engine}
            </span>
          </h3>
          <Badge tone={ocr.handwriting_detected ? 'warn' : 'info'}>
            {ocr.handwriting_detected ? '✍️ Handwriting recognition' : '📄 Printed text'}
          </Badge>
        </div>
        <div className="card-body">
          <div className="grid grid-2">
            <div className="kv-list">
              <div className="kv">
                <span className="kv-key">OCR status</span>
                <span className="kv-val">Processed</span>
              </div>
              <div className="kv">
                <span className="kv-key">Detection basis</span>
                <span className="kv-val">{ocr.handwriting_reason}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Recognition confidence</span>
                <span className="kv-val">{percent(ocr.recognition_confidence)}</span>
              </div>
              <div className="kv">
                <span className="kv-key">Fields extracted</span>
                <span className="kv-val">{(ocr.fields || []).length}</span>
              </div>
            </div>
            <ConfidenceIndicator
              value={ocr.overall_confidence}
              label="Document confidence"
              showNote
            />
          </div>

          <div
            className={`alert mt-2 ${flagged.length ? 'alert-warn' : 'alert-ok'}`}
          >
            <span className="alert-icon" aria-hidden="true">
              {flagged.length ? '🔍' : '✅'}
            </span>
            <div className="alert-body">
              <div className="alert-title">
                {flagged.length
                  ? `${flagged.length} field(s) sent for pharmacist verification`
                  : 'Accepted into health memory'}
              </div>
              {result.message}
            </div>
          </div>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>
              Needs human confirmation
              <span className="card-sub">
                Clinically important fields read below the auto-accept threshold
              </span>
            </h3>
          </div>
          <div className="card-body flush">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>OCR read</th>
                    <th style={{ width: 170 }}>Confidence</th>
                    <th>Routing</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((field, index) => (
                    <tr key={`${field.field}-${index}`}>
                      <td className="strong">{field.label}</td>
                      <td>
                        <span className="mono">{field.value || '—'}</span>
                        {field.ocr_reading && field.ocr_reading !== field.value && (
                          <div className="tiny faint">
                            raw: “{field.ocr_reading}”
                          </div>
                        )}
                      </td>
                      <td>
                        <ConfidenceIndicator value={field.confidence} label="" />
                      </td>
                      <td>
                        <PriorityBadge priority={field.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>
              Accepted into health memory
              <span className="card-sub">Provenance preserved for every entry</span>
            </h3>
          </div>
          <div className="card-body">
            <div className="row">
              {accepted.map((field, index) => (
                <Badge key={`${field.field}-${index}`} tone="outline">
                  {field.label}: {truncate(field.value, 40)} ·{' '}
                  {percent(field.confidence)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {routing && (
        <div className="card">
          <div className="card-header">
            <h3>
              Doctor routing
              <span className="card-sub">
                Identified from the content of the medical record
              </span>
            </h3>
          </div>
          <div className="card-body">
            {routing.doctor ? (
              <div className="kv-list">
                <div className="kv">
                  <span className="kv-key">Doctor</span>
                  <span className="kv-val">{routing.doctor.name}</span>
                </div>
                {routing.doctor.specialty && (
                  <div className="kv">
                    <span className="kv-key">Specialty</span>
                    <span className="kv-val">{routing.doctor.specialty}</span>
                  </div>
                )}
                {routing.doctor.hospital && (
                  <div className="kv">
                    <span className="kv-key">Hospital / Clinic</span>
                    <span className="kv-val">{routing.doctor.hospital}</span>
                  </div>
                )}
                <div className="kv">
                  <span className="kv-key">Status</span>
                  <span className="kv-val">
                    <Badge tone={routing.routed ? 'ok' : 'outline'}>
                      {routing.routed ? 'Routed to doctor' : 'External / Not registered'}
                    </Badge>
                  </span>
                </div>
                <div className="kv">
                  <span className="kv-key">Consent</span>
                  <span className="kv-val">
                    {routing.consent_granted ? 'Granted' : 'Not granted'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="muted">{routing.reason || routing.message}</p>
            )}
            <p className="tiny faint mt-1">
              A doctor account is never created automatically. Unregistered doctors
              are recorded as external providers so the source is not lost.
            </p>
          </div>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onDone}>
          Back to my health memory
        </button>
        {flagged.length > 0 && onViewQueue && (
          <button type="button" className="btn btn-outline" onClick={onViewQueue}>
            What happens next?
          </button>
        )}
      </div>

      <details className="card">
        <summary
          style={{ padding: '13px 18px', cursor: 'pointer', fontWeight: 600 }}
        >
          View the raw text the recogniser produced
        </summary>
        <div className="card-body">
          <div className="doc-preview">{ocr.raw_text || '(no text recognised)'}</div>
        </div>
      </details>
    </div>
  );
}

export default OCRResult;
