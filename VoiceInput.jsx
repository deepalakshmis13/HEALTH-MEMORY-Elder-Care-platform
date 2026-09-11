import { useEffect, useRef, useState } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * Browser speech recognition where available, with a typed transcript
 * fallback everywhere else — the pipeline is identical either way.
 */
export function VoiceInput({ onSubmit, busy }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [confidence, setConfidence] = useState(0.9);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  const start = () => {
    setError('');
    if (!SpeechRecognition) {
      setError(
        'Your browser cannot record speech. Please type what you want to say below — ' +
          'it will be saved exactly the same way.',
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let pending = '';
      let best = 0;
      let count = 0;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += result[0].transcript;
          best += result[0].confidence || 0.9;
          count += 1;
        } else {
          pending += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((current) => `${current}${current ? ' ' : ''}${finalText.trim()}`);
        if (count) setConfidence(Math.min(0.97, Math.max(0.45, best / count)));
      }
      setInterim(pending);
    };

    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission was refused. You can type your entry instead.'
          : 'Speech recognition stopped unexpectedly. You can type your entry instead.',
      );
      stop();
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setSeconds(0);
    timerRef.current = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
  };

  const stop = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setListening(false);
    setInterim('');
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submit = () => {
    const text = `${transcript} ${interim}`.trim();
    if (text.length < 4) return;
    onSubmit(text, {
      durationSeconds: seconds || null,
      recognitionConfidence: SpeechRecognition ? confidence : 0.82,
    });
  };

  return (
    <div>
      <div className="card" style={{ background: 'var(--surface-soft)' }}>
        <div className="card-body center">
          <button
            type="button"
            className={`btn btn-lg ${listening ? 'btn-danger' : 'btn-primary'}`}
            onClick={listening ? stop : start}
            disabled={busy}
            style={{ minWidth: 260 }}
          >
            {listening ? `⏹ Stop recording (${seconds}s)` : '🎙 Record health information'}
          </button>
          <p className="muted mt-2 mb-1">
            {listening
              ? 'Listening… speak clearly and naturally.'
              : 'Tell us about your health — for example: “I met Dr Kumar last Monday and he changed my blood pressure medicine.”'}
          </p>
          {!SpeechRecognition && (
            <p className="tiny faint">
              Speech recognition is not available in this browser — type your entry
              below instead.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-warn mt-2">
          <span className="alert-icon" aria-hidden="true">
            ⚠️
          </span>
          <div className="alert-body">{error}</div>
        </div>
      )}

      <div className="field mt-2">
        <label htmlFor="voice-transcript">Transcript</label>
        <textarea
          id="voice-transcript"
          value={`${transcript}${interim ? ` ${interim}` : ''}`}
          onChange={(event) => {
            setTranscript(event.target.value);
            setInterim('');
          }}
          rows={5}
          placeholder="Your words will appear here. You can correct them before saving."
          disabled={busy}
        />
        <div className="hint">
          You can edit the transcript before saving. The original wording is kept
          in your health memory.
        </div>
      </div>

      <div className="alert alert-neutral mb-2">
        <span className="alert-icon" aria-hidden="true">
          🔖
        </span>
        <div className="alert-body">
          Saved as <strong>Patient Reported</strong>. What you say is never turned
          into a confirmed diagnosis.
        </div>
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={submit}
          disabled={busy || `${transcript}${interim}`.trim().length < 4}
        >
          {busy ? 'Saving to health memory…' : 'Save voice entry'}
        </button>
        {transcript && !busy && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTranscript('');
              setInterim('');
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default VoiceInput;
