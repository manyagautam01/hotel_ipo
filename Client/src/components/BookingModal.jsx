import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { bookingApi, errorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { localISODate, nightsBetween, money } from '../utils/format.js';

export default function BookingModal({ room, onClose, onBooked }) {
  const toast = useToast();
  const [checkIn, setCheckIn] = useState(localISODate(1));
  const [checkOut, setCheckOut] = useState(localISODate(2));
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nights = nightsBetween(checkIn, checkOut);
  const total = nights > 0 ? nights * room.price : 0;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!checkIn || !checkOut) return setError('Please choose both dates.');
    if (nights < 1) return setError('Check-out must be after check-in.');
    if (guests < 1 || guests > room.capacity) return setError(`Guests must be between 1 and ${room.capacity}.`);
    setSaving(true);
    try {
      const { data } = await bookingApi.create({ roomId: room._id, checkIn, checkOut, guests: Number(guests) });
      toast.success(`Room ${room.roomNumber} booked for ${nights} night${nights > 1 ? 's' : ''}.`);
      onBooked?.(data.booking);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="book-title">
        <button className="modal-close" aria-label="Close" onClick={onClose}><X size={20} /></button>
        <h2 id="book-title">Book room {room.roomNumber}</h2>
        <p className="muted">{room.type} · {money(room.price)} per night · sleeps {room.capacity}</p>
        <form onSubmit={submit} noValidate>
          <div className="field-row">
            <div className="field">
              <label htmlFor="checkin">Check-in</label>
              <input id="checkin" type="date" min={localISODate(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="checkout">Check-out</label>
              <input id="checkout" type="date" min={checkIn || localISODate(0)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="guests">Guests (max {room.capacity})</label>
            <input id="guests" type="number" min="1" max={room.capacity} value={guests} onChange={(e) => setGuests(e.target.value)} />
          </div>
          <div className="summary">
            <div><span>Nights</span><strong>{nights > 0 ? nights : '–'}</strong></div>
            <div><span>Estimated total</span><strong>{total ? money(total) : '–'}</strong></div>
            <p className="muted small">No payment is taken. This reserves the room only.</p>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Booking…' : 'Confirm booking'}</button>
        </form>
      </div>
    </div>
  );
}
