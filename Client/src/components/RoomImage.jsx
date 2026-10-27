import { useState } from 'react';
import { BedDouble } from 'lucide-react';

// Shows the photo, or a drawn placeholder if there is no URL or it fails to load.
export default function RoomImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <BedDouble size={40} />
      </div>
    );
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
