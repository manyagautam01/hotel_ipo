import { useCallback, useEffect, useState } from 'react';
import { CalendarX2, BedDouble, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { bookingApi, roomApi, errorMessage } from '../services/api.js';
import RoomBrowser from '../components/RoomBrowser.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { day, money, isActive, canCancel } from '../utils/format.js';

export default function UserDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setError('');
    try {
      const [b, r] = await Promise.all([bookingApi.mine(), roomApi.list({ available: 'true' })]);
      setBookings(b.data.bookings);
      setAvailableCount(r.data.rooms.length);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel your stay in room ${b.room?.roomNumber}?`)) return;
    try {
      await bookingApi.cancel(b._id);
      toast.success('Booking cancelled.');
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const active = bookings.filter(isActive).length;

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Welcome, {user.name.split(' ')[0]}</h1>
        <p className="muted">Here is what is happening with your stays.</p>
      </div>

      <div className="stat-grid two">
        <div className="stat"><span className="stat-icon"><BedDouble size={20} /></span><div><strong>{availableCount}</strong><span>Rooms available</span></div></div>
        <div className="stat"><span className="stat-icon"><CalendarCheck size={20} /></span><div><strong>{active}</strong><span>Your active bookings</span></div></div>
      </div>

      <section className="panel">
        <h2>My bookings</h2>
        {loading ? (
          <Spinner label="Loading your bookings…" />
        ) : error ? (
          <EmptyState icon={CalendarX2} title="We couldn't load your bookings" text={error} action={<button className="btn btn-outline" onClick={load}>Try again</button>} />
        ) : bookings.length === 0 ? (
          <EmptyState icon={CalendarX2} title="No bookings yet" text="When you book a room it will show up here. Pick one below to get started." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Room</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td data-label="Room"><strong>{b.room ? `Room ${b.room.roomNumber}` : 'Removed room'}</strong><br /><span className="muted small">{b.room?.type}</span></td>
                    <td data-label="Check-in">{day(b.checkIn)}</td>
                    <td data-label="Check-out">{day(b.checkOut)}</td>
                    <td data-label="Guests">{b.guests}</td>
                    <td data-label="Total">{money(b.totalPrice)}<br /><span className="muted small">{b.nights} night{b.nights > 1 ? 's' : ''}</span></td>
                    <td data-label="Status"><StatusBadge status={b.status} /></td>
                    <td>{canCancel(b) && <button className="btn btn-danger-outline btn-sm" onClick={() => cancel(b)}>Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" id="rooms">
        <h2>Book a room</h2>
        <RoomBrowser reloadKey={tick} onBooked={() => setTick((t) => t + 1)} />
      </section>
    </div>
  );
}
