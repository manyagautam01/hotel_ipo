import { useCallback, useEffect, useState } from 'react';
import { BedDouble, DoorOpen, Users, CalendarRange, CheckCircle2, Trash2, PlusCircle } from 'lucide-react';
import { roomApi, userApi, bookingApi, errorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { day, stamp, money } from '../utils/format.js';

const TABS = [
  { id: 'rooms', label: 'All rooms' },
  { id: 'add', label: 'Add rooms' },
  { id: 'users', label: 'All users' },
  { id: 'bookings', label: 'All bookings' },
];
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'];
const BLANK = { roomNumber: '', type: 'Standard', price: '', capacity: 2, description: '', image: '' };

export default function AdminDashboard() {
  const toast = useToast();
  const [tab, setTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [r, u, b] = await Promise.all([roomApi.list(), userApi.list(), bookingApi.all()]);
      setRooms(r.data.rooms);
      setUsers(u.data.users);
      setBookings(b.data.bookings);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = [
    { icon: BedDouble, label: 'Total rooms', value: rooms.length },
    { icon: DoorOpen, label: 'Available rooms', value: rooms.filter((r) => r.isAvailable).length },
    { icon: Users, label: 'Registered users', value: users.length },
    { icon: CalendarRange, label: 'Total bookings', value: bookings.length },
    { icon: CheckCircle2, label: 'Confirmed bookings', value: bookings.filter((b) => b.status === 'confirmed').length },
  ];

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Admin dashboard</h1>
        <p className="muted">Manage rooms, guests and reservations.</p>
      </div>

      {loading ? (
        <Spinner label="Loading hotel data…" />
      ) : error ? (
        <EmptyState icon={BedDouble} title="We couldn't load the dashboard" text={error} action={<button className="btn btn-outline" onClick={load}>Try again</button>} />
      ) : (
        <>
          <div className="stat-grid">
            {stats.map(({ icon: Icon, label, value }) => (
              <div className="stat" key={label}>
                <span className="stat-icon"><Icon size={20} /></span>
                <div><strong>{value}</strong><span>{label}</span></div>
              </div>
            ))}
          </div>

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <section className="panel">
            {tab === 'rooms' && <RoomsTable rooms={rooms} reload={load} toast={toast} goAdd={() => setTab('add')} />}
            {tab === 'add' && <AddRoom reload={load} toast={toast} done={() => setTab('rooms')} />}
            {tab === 'users' && <UsersTable users={users} />}
            {tab === 'bookings' && <BookingsTable bookings={bookings} reload={load} toast={toast} />}
          </section>
        </>
      )}
    </div>
  );
}

function RoomsTable({ rooms, reload, toast, goAdd }) {
  const toggle = async (r) => {
    try {
      await roomApi.setAvailability(r._id, !r.isAvailable);
      toast.success(`Room ${r.roomNumber} is now ${r.isAvailable ? 'unavailable' : 'available'}.`);
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete room ${r.roomNumber}? This cannot be undone.`)) return;
    try {
      await roomApi.remove(r._id);
      toast.success(`Room ${r.roomNumber} deleted.`);
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!rooms.length) {
    return <EmptyState icon={BedDouble} title="No rooms yet" text="Add your first room so guests can start booking." action={<button className="btn btn-primary" onClick={goAdd}><PlusCircle size={16} /> Add a room</button>} />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Room</th><th>Type</th><th>Price / night</th><th>Capacity</th><th>Availability</th><th></th></tr></thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r._id}>
              <td data-label="Room"><strong>{r.roomNumber}</strong></td>
              <td data-label="Type">{r.type}</td>
              <td data-label="Price">{money(r.price)}</td>
              <td data-label="Capacity">{r.capacity}</td>
              <td data-label="Availability">
                <button className={`switch ${r.isAvailable ? 'on' : ''}`} role="switch" aria-checked={r.isAvailable} aria-label={`Room ${r.roomNumber} availability`} onClick={() => toggle(r)}>
                  <span />
                </button>
                <span className="small muted"> {r.isAvailable ? 'Available' : 'Unavailable'}</span>
              </td>
              <td><button className="btn btn-danger-outline btn-sm" onClick={() => remove(r)}><Trash2 size={14} /> Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddRoom({ reload, toast, done }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.roomNumber.trim()) e.roomNumber = 'Room number is required.';
    if (!(Number(form.price) > 0)) e.price = 'Enter a price above 0.';
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) e.capacity = 'Enter a whole number of 1 or more.';
    if (form.description.trim().length < 10) e.description = 'Write at least 10 characters.';
    if (form.image.trim() && !/^https?:\/\/\S+$/i.test(form.image.trim())) e.image = 'Use a full http(s) link.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await roomApi.create({ ...form, price: Number(form.price), capacity: Number(form.capacity) });
      toast.success(`Room ${form.roomNumber} added.`);
      setForm(BLANK);
      await reload();
      done();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="roomNumber">Room number</label>
        <input id="roomNumber" value={form.roomNumber} onChange={set('roomNumber')} aria-invalid={!!errors.roomNumber} />
        {errors.roomNumber && <span className="field-error">{errors.roomNumber}</span>}
      </div>
      <div className="field">
        <label htmlFor="type">Room type</label>
        <select id="type" value={form.type} onChange={set('type')}>
          {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="price">Price per night (₹)</label>
        <input id="price" type="number" min="1" value={form.price} onChange={set('price')} aria-invalid={!!errors.price} />
        {errors.price && <span className="field-error">{errors.price}</span>}
      </div>
      <div className="field">
        <label htmlFor="capacity">Guest capacity</label>
        <input id="capacity" type="number" min="1" max="12" value={form.capacity} onChange={set('capacity')} aria-invalid={!!errors.capacity} />
        {errors.capacity && <span className="field-error">{errors.capacity}</span>}
      </div>
      <div className="field full">
        <label htmlFor="description">Description</label>
        <textarea id="description" rows="3" value={form.description} onChange={set('description')} aria-invalid={!!errors.description} />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>
      <div className="field full">
        <label htmlFor="image">Image URL (optional)</label>
        <input id="image" placeholder="https://…" value={form.image} onChange={set('image')} aria-invalid={!!errors.image} />
        {errors.image && <span className="field-error">{errors.image}</span>}
      </div>
      {serverError && <p className="form-error full" role="alert">{serverError}</p>}
      <div className="full"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add room'}</button></div>
    </form>
  );
}

function UsersTable({ users }) {
  if (!users.length) return <EmptyState icon={Users} title="No users yet" />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td data-label="Name"><strong>{u.name}</strong></td>
              <td data-label="Email">{u.email}</td>
              <td data-label="Role"><span className={`badge badge-${u.role}`}>{u.role}</span></td>
              <td data-label="Registered">{stamp(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingsTable({ bookings, reload, toast }) {
  const update = async (b, status) => {
    const verb = status === 'cancelled' ? 'Cancel' : 'Mark as completed';
    if (!window.confirm(`${verb} this booking?`)) return;
    try {
      await bookingApi.setStatus(b._id, status);
      toast.success(status === 'cancelled' ? 'Booking cancelled.' : 'Booking marked as completed.');
      reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!bookings.length) return <EmptyState icon={CalendarRange} title="No bookings yet" text="Reservations made by guests will appear here." />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Guest</th><th>Room</th><th>Stay</th><th>Guests</th><th>Booked on</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td data-label="Guest"><strong>{b.user?.name || 'Deleted user'}</strong><br /><span className="muted small">{b.user?.email}</span></td>
              <td data-label="Room">{b.room ? `${b.room.roomNumber} · ${b.room.type}` : 'Removed room'}</td>
              <td data-label="Stay">{day(b.checkIn)} → {day(b.checkOut)}<br /><span className="muted small">{b.nights} night{b.nights > 1 ? 's' : ''} · {money(b.totalPrice)}</span></td>
              <td data-label="Guests">{b.guests}</td>
              <td data-label="Booked on">{stamp(b.createdAt)}</td>
              <td data-label="Status"><StatusBadge status={b.status} /></td>
              <td>
                {b.status === 'confirmed' && (
                  <div className="row-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => update(b, 'completed')}>Complete</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => update(b, 'cancelled')}>Cancel</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
