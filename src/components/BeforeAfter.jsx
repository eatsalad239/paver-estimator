import { useState } from 'react';

// Drag-to-reveal before/after comparison. Two copies of the same photo are
// stacked: the "after" (CSS-filtered) sits underneath; the original "before"
// sits on top, clipped from the right so the slider reveals the after.
// A full-cover invisible <input type=range> drives it — pointer + touch +
// keyboard accessible with zero measurement.
export default function BeforeAfter({ src, filter, sheen, afterLabel }) {
  const [pos, setPos] = useState(50); // % of the "before" image still visible (from left)

  return (
    <div className="pest-ba">
      {/* AFTER (underneath) */}
      <img className="pest-ba-img" src={src} alt={`${afterLabel} (simulated)`} style={{ filter }} draggable="false" />
      {sheen && <div className="pest-ba-sheen" aria-hidden="true" />}

      {/* BEFORE (on top, clipped to the left `pos%`) */}
      <img
        className="pest-ba-img pest-ba-before"
        src={src}
        alt="Before"
        draggable="false"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      <div className="pest-ba-divider" style={{ left: `${pos}%` }} aria-hidden="true" />
      <div className="pest-ba-knob" style={{ left: `${pos}%` }} aria-hidden="true">
        ‹›
      </div>

      <span className="pest-ba-tag pest-ba-tag-before">Before</span>
      <span className="pest-ba-tag pest-ba-tag-after">{afterLabel} (simulated)</span>

      <input
        className="pest-ba-range"
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Slide to compare before and after"
      />
    </div>
  );
}
