import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState icon={Compass} title="This page doesn't exist" text="The link may be broken or the page may have moved." action={<Link to="/" className="btn btn-primary">Back to home</Link>} />
    </div>
  );
}
