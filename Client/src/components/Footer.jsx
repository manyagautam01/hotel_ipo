import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo light />
          <p className="footer-text">Thoughtfully kept rooms, booked in a minute. Roomly connects guests with comfortable stays and gives hotel teams one calm place to manage them.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <a href="/#rooms">Rooms</a>
          <a href="/#why">Why Roomly</a>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
          <Link to="/dashboard">My bookings</Link>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} Roomly. College project: no payments are taken.</div>
    </footer>
  );
}
