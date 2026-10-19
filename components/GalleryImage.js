import { useEffect, useState } from 'react';

// Keep the last decoded frame on screen while the requested photo loads.
// Effect cleanup ensures a slow, older request cannot replace a newer choice.
export default function GalleryImage({ src, alt, className = '', fetchPriority = 'auto', ...props }) {
  const [{ shown, previous }, setFrames] = useState({ shown: null, previous: null });
  const [failed, setFailed] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const photo = new Image();
    photo.fetchPriority = fetchPriority;
    const ready = async () => {
      try { await photo.decode(); } catch { /* onload still guarantees usable pixels */ }
      if (!cancelled) { setFrames(frames => ({ shown: { src, alt }, previous: matchMedia('(prefers-reduced-motion: reduce)').matches ? null : frames.shown })); setFailed(null); }
    };
    photo.onload = ready;
    photo.onerror = () => { if (!cancelled) setFailed(src); };
    photo.src = src;
    return () => { cancelled = true; photo.onload = null; photo.onerror = null; };
  }, [src, alt, fetchPriority]);
  return <span className={`gallery-image ${className}`}>
    {previous && <img src={previous.src} alt="" aria-hidden="true" className="gallery-image-previous"/>}
    {shown && <img {...props} fetchPriority={fetchPriority} key={shown.src} src={shown.src} alt={shown.alt} className="gallery-image-frame" onAnimationEnd={() => setFrames(frames => ({ ...frames, previous: null }))} decoding="async"/>}
    {failed === src && <span className="gallery-image-error" role="status">Снимката не е достъпна</span>}
  </span>;
}
