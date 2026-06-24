import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand" aria-label="Itinera dashboard">
          <span className="brand-mark">I</span>
          <span>Itinera</span>
        </NavLink>
        <nav className="topnav" aria-label="Main navigation">
          <NavLink to="/dashboard">Trips</NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/account">Account</NavLink>
          <button type="button" className="text-button" onClick={handleLogout}>Sign out</button>
        </nav>
      </header>
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
