import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function HomePage() {
  const { user } = useAuth();
  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="brand">
          <span className="brand-mark">I</span>
          <span>Itinera</span>
        </Link>
        <div className="landing-actions">
          {user ? (
            <Link className="button primary" to="/dashboard">Open dashboard</Link>
          ) : (
            <>
              <Link className="button ghost" to="/login">Sign in</Link>
              <Link className="button primary" to="/register">Create account</Link>
            </>
          )}
        </div>
      </header>
      <main className="hero">
        <div className="hero-copy">
          <span className="eyebrow">A calmer way to plan together</span>
          <h1>Your trip, laid out like the notes you naturally make.</h1>
          <p>
            Build day-by-day itineraries, add times and descriptions with a double click,
            and share a beautiful read-only plan or invite trusted collaborators.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" to={user ? '/dashboard' : '/register'}>
              Start planning
            </Link>
            <a className="button ghost large" href="#preview">See the calendar</a>
          </div>
        </div>
        <div id="preview" className="hero-preview" aria-label="Calendar preview">
          {['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24'].map((day, index) => (
            <div className="preview-day" key={day}>
              <strong>{day}</strong>
              <div className={`preview-card tone-${index + 1}`}>
                <span>{index === 0 ? '08:30' : index === 1 ? '10:00' : index === 2 ? '09:15' : '11:30'}</span>
                <b>{['Flight to Milan', 'Lake Como ferry', 'Dolomites drive', 'Seceda hike'][index]}</b>
                <small>{['Terminal 2', 'Varenna pier', 'Scenic route', 'Ortisei'][index]}</small>
              </div>
              <div className="preview-empty">Double-click to add</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
