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
        <NavLink to="/dashboard" className="brand" aria-label="Panel de Itinera">
          <span className="brand-mark">I</span>
          <span>Itinera</span>
        </NavLink>
        <nav className="topnav" aria-label="Navegación principal">
          <NavLink to="/dashboard">Viajes</NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin">Administración</NavLink>}
          <NavLink to="/account">Cuenta</NavLink>
          <button type="button" className="text-button" onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      </header>
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
