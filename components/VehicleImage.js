import { useEffect, useState } from 'react';

export default function VehicleImage({ src, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? <span className="vehicle-photo-fallback" role="img" aria-label={`${alt} — снимката е недостъпна`}>Снимката е недостъпна</span> : <img {...props} src={src} alt={alt} onError={() => setFailed(true)}/>;
}
