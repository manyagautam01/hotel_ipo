export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Dates from the API are UTC midnight; format in UTC so they never shift a day.
export const day = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const stamp = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Local "YYYY-MM-DD" for <input type="date"> min values.
export function localISODate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nightsBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

// A booking is "active" if confirmed and the stay has not ended yet.
export function isActive(b) {
  if (b.status !== 'confirmed') return false;
  const end = new Date(b.checkOut).getTime();
  return end >= Date.now() - 86400000;
}

// A confirmed stay that has not started yet can be cancelled by the guest.
export function canCancel(b) {
  if (b.status !== 'confirmed') return false;
  const start = new Date(b.checkIn);
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return start.getTime() >= todayUTC;
}
