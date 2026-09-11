import { useState } from 'react';
import { SOURCE_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

/** "Why am I seeing this?" — every AI answer shows its sources (§36). */
export function EvidencePanel({ sources = [], explanation, retrieval }) {
  const [open, setOpen] = useState(false);
  if (!sources.length && !explanation) return null;

  return (
    <div className="evidence-panel">
      <button
        type="button"
        className="evidence-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        Why am I seeing this? ({sources.length} source
        {sources.length === 1 ? '' : 's'})
      </button>
      {open && (
        <div className="evidence-list">
          {explanation && <p className="tiny muted">{explanation}</p>}
          {sources.map((source, index) => (
            <div className="evidence-item" key={`${source.source_id}-${index}`}>
              <div className="ev-title">{source.title}</div>
              <div className="ev-meta">
                {SOURCE_LABELS[source.source_type] || source.source_type} ·{' '}
                {formatDate(source.date)}
                {source.trust_level ? ` · ${source.trust_level}` : ''}
                {source.verification_status === 'PENDING_VERIFICATION'
                  ? ' · not yet verified'
                  : ''}
              </div>
              {source.excerpt && <div className="ev-excerpt">{source.excerpt}</div>}
            </div>
          ))}
          {retrieval && (
            <div className="tiny faint">
              Retrieved {retrieval.chunks_used} of {retrieval.chunks_considered}{' '}
              candidate chunks after patient isolation, role authorization and
              consent filtering.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EvidencePanel;
