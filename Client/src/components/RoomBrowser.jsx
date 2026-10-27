import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BedDouble } from 'lucide-react';
import useRooms from '../hooks/useRooms.js';
import { useAuth } from '../context/AuthContext.jsx';
import RoomCard from './RoomCard.jsx';
import BookingModal from './BookingModal.jsx';
import Spinner from './Spinner.jsx';
import EmptyState from './EmptyState.jsx';

const TYPES = ['All', 'Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'];

// Shared by the Home page and the guest dashboard.
export default function RoomBrowser({ onBooked, reloadKey }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { rooms, loading, error, reload } = useRooms({ available: 'true', k: reloadKey });
  const [type, setType] = useState('All');
  const [selected, setSelected] = useState(null);

  const visible = useMemo(() => (type === 'All' ? rooms : rooms.filter((r) => r.type === type)), [rooms, type]);

  const handleBook = (room) => {
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role === 'admin') return navigate('/admin');
    setSelected(room);
  };

  return (
    <>
      <div className="chips" role="tablist" aria-label="Filter by room type">
        {TYPES.map((t) => (
          <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Finding rooms…" />
      ) : error ? (
        <EmptyState icon={BedDouble} title="We couldn't load the rooms" text={error} action={<button className="btn btn-outline" onClick={reload}>Try again</button>} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={rooms.length === 0 ? 'No rooms are listed yet' : `No ${type.toLowerCase()} rooms available`}
          text={rooms.length === 0 ? 'Rooms appear here as soon as the hotel adds them. Please check back shortly.' : 'Try another room type to see more options.'}
        />
      ) : (
        <div className="room-grid">
          {visible.map((r) => <RoomCard key={r._id} room={r} onBook={handleBook} />)}
        </div>
      )}

      {selected && (
        <BookingModal
          room={selected}
          onClose={() => setSelected(null)}
          onBooked={(b) => {
            onBooked?.(b);
            navigate('/dashboard');
          }}
        />
      )}
    </>
  );
}
