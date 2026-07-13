import { useRef, useState } from 'react';
import BeforeAfter from '../components/BeforeAfter.jsx';

// Step — optional photo upload with an instant "after" preview.
// The photo is turned into a local object URL and never uploaded anywhere.
// Any service with a `previewFilters` entry gets a before/after slider; services
// that require a consult (installation) also show a consult note.
export default function PhotoStep({ config, service, photoUrl, onPhoto, onContinue, onBack }) {
  const svc = config.services.find((s) => s.id === service);
  const previewType = svc?.preview || 'none';
  const filter = config.previewFilters?.[previewType]; // undefined if this service has no filter
  const needsConsult = Boolean(svc?.requiresConsult);

  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, HEIC…).');
      return;
    }
    const maxBytes = (config.photo?.maxSizeMB || 15) * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`That image is too large (max ${config.photo?.maxSizeMB || 15} MB).`);
      return;
    }
    setError('');
    onPhoto(URL.createObjectURL(file)); // parent stores it and revokes the previous one
    e.target.value = ''; // allow re-selecting the same file later
  };

  return (
    <div className="pest-step">
      <h2 className="pest-title">{config.photo?.prompt || 'See the transformation'}</h2>
      <p className="pest-subtitle">
        {config.photo?.hint || 'Upload a photo of your pavers — it stays on your device.'}
      </p>

      {!photoUrl && (
        <button type="button" className="pest-upload" onClick={openPicker}>
          <span className="pest-upload-icon" aria-hidden="true">
            📷
          </span>
          <span className="pest-upload-text">Tap to upload a photo</span>
          <span className="pest-upload-sub">Your photo never leaves your device</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        aria-label="Upload a photo of your pavers"
        style={{ display: 'none' }}
      />

      {error && (
        <div className="pest-input-error" role="alert">
          {error}
        </div>
      )}

      {photoUrl && filter && (
        <BeforeAfter src={photoUrl} filter={filter.css} sheen={filter.sheen} afterLabel={filter.afterLabel} />
      )}
      {photoUrl && !filter && (
        <div className="pest-photo-consult">
          <img className="pest-ba-img" src={photoUrl} alt="Your pavers" draggable="false" />
        </div>
      )}
      {photoUrl && needsConsult && (
        <div className="pest-range-caption">A quick on-site design consult finalizes your new install.</div>
      )}

      {photoUrl && (
        <button type="button" className="pest-retake" onClick={openPicker}>
          Choose a different photo
        </button>
      )}

      <div className="pest-actions">
        <button type="button" className="pest-btn pest-btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="pest-btn pest-btn-primary" onClick={onContinue}>
          {photoUrl ? 'Continue' : 'Skip — continue'}
        </button>
      </div>
    </div>
  );
}
