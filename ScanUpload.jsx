import { useRef, useState } from 'react';
import { PipelineProgress } from '../common/LoadingState';
import { LOADING_MESSAGES } from '../../utils/constants';

const STEPS = [
  'Validating the file…',
  LOADING_MESSAGES.document,
  LOADING_MESSAGES.handwriting,
  LOADING_MESSAGES.confidence,
  LOADING_MESSAGES.memory,
];

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,.txt,.doc,.docx';

export function ScanUpload({ onUpload, busy, progressStep }) {
  const [file, setFile] = useState(null);
  const [handwritten, setHandwritten] = useState('auto');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const pick = (selected) => {
    if (!selected) return;
    setFile(selected);
    const name = selected.name.toLowerCase();
    if (/handwrit|scribble|note|rx/.test(name)) setHandwritten('yes');
  };

  const submit = () => {
    if (!file) return;
    onUpload(file, handwritten === 'yes');
  };

  if (busy) {
    return (
      <div className="card">
        <div className="card-body">
          <h3 className="mb-2">Processing {file?.name}</h3>
          <PipelineProgress steps={STEPS} activeIndex={progressStep} />
          <p className="muted small mt-2">
            Documents are read, scored field by field, and only then written to
            health memory. Anything uncertain and clinically important is sent to a
            pharmacist rather than accepted silently.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`dropzone${dragging ? ' drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
      >
        <span className="dz-icon" aria-hidden="true">
          📄
        </span>
        <div className="dz-title">
          {file ? file.name : 'Choose a medical report or take a photo'}
        </div>
        <div className="dz-sub">
          {file
            ? `${(file.size / 1024).toFixed(0)} KB — click to choose a different file`
            : 'PDF, photo or scan of a prescription, lab report or doctor’s note'}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hide"
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </div>

      <div className="field mt-2">
        <span className="form-label">Is this document handwritten?</span>
        <div className="row">
          {[
            { key: 'auto', label: 'Detect automatically' },
            { key: 'yes', label: 'Yes — handwritten by the doctor' },
            { key: 'no', label: 'No — printed / typed' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className={`chip${handwritten === option.key ? ' active' : ''}`}
              onClick={() => setHandwritten(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="hint">
          Handwritten pages are read by the handwriting recogniser, which is less
          certain than printed text — so more of its fields get sent for human
          verification.
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={submit}
        disabled={!file}
      >
        Upload and read this document
      </button>
    </div>
  );
}

export default ScanUpload;
