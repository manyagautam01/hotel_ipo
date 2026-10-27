import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarCheck, Sparkles } from 'lucide-react';
import RoomBrowser from '../components/RoomBrowser.jsx';
import RoomImage from '../components/RoomImage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const HERO_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=75';

const benefits = [
  { icon: CalendarCheck, title: 'See what is really free', text: 'Availability comes straight from the hotel. If a room is shown, it can be booked for your dates.' },
  { icon: Sparkles, title: 'Know the cost up front', text: 'Pick your dates and see the number of nights and the estimated total before you confirm.' },
  { icon: ShieldCheck, title: 'Your stays, in one place', text: 'Review upcoming and past bookings, and cancel an upcoming stay in one click.' },
];

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Stay somewhere you'll remember</h1>
            <p>Quiet rooms, honest prices and a booking that takes a minute. Choose your room, pick your dates and you're set.</p>
            <div className="hero-actions">
              <a href="#rooms" className="btn btn-primary btn-lg">Browse rooms</a>
              {!user && <Link to="/register" className="btn btn-outline btn-lg">Create account</Link>}
            </div>
          </div>
          <div className="hero-arch">
            <RoomImage src={HERO_IMG} alt="A bright hotel room with a made bed" />
          </div>
        </div>
      </section>

      <section id="rooms" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Rooms ready for you</h2>
            <p>Every room below is open for booking today.</p>
          </div>
          <RoomBrowser />
        </div>
      </section>

      <section id="why" className="section section-tint">
        <div className="container">
          <div className="section-head">
            <h2>Why guests book with Roomly</h2>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div className="benefit" key={title}>
                <span className="benefit-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
