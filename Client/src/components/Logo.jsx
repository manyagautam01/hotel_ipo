export default function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo-light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#f7f1e3' : '#1f3d2f'} />
        <path d="M20 46V30a12 12 0 0 1 24 0v16" fill="none" stroke={light ? '#1f3d2f' : '#f7f1e3'} strokeWidth="5" strokeLinecap="round" />
        <circle cx="32" cy="34" r="3.5" fill="#c46f4a" />
      </svg>
      Roomly
    </span>
  );
}
