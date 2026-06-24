import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Icon } from './Icon';

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
        <NavLink to="/dashboard" className="brand" aria-label="Panel de Itinera">
          <span className="brand-mark" aria-hidden="true">I</span>
          <span>Itinera</span>
        </NavLink>

        <nav className="topnav" aria-label="Navegación principal">
          <NavLink to="/dashboard" aria-label="Itinerarios" title="Itinerarios">
            <Icon name="briefcase" size={19} />
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" aria-label="Administración" title="Administración">
              <Icon name="shield" size={19} />
            </NavLink>
          )}
          <NavLink to="/account" aria-label="Cuenta" title="Cuenta">
            <Icon name="user-round" size={19} />
          </NavLink>
          <button type="button" className="text-button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="log-out" size={19} />
          </button>
        </nav>
      </header>
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
