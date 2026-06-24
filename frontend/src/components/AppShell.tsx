import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Icon } from './Icon';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/dashboard" className="brand" aria-label="Panel de Itinera" onClick={closeMenu}>
          <span className="brand-mark">I</span>
          <span>Itinera</span>
        </NavLink>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          title={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
        </button>
        <nav id="main-navigation" className={`topnav${menuOpen ? ' open' : ''}`} aria-label="Navegación principal">
          <NavLink to="/dashboard" onClick={closeMenu} aria-label="Itinerarios" title="Itinerarios"><Icon name="briefcase" size={18} /></NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={closeMenu} aria-label="Administración" title="Administración"><Icon name="shield" size={18} /></NavLink>}
          <NavLink to="/account" onClick={closeMenu} aria-label="Cuenta" title="Cuenta"><Icon name="user-round" size={18} /></NavLink>
          <button type="button" className="text-button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="log-out" size={18} /></button>
        </nav>
      </header>
      {menuOpen && <button type="button" className="mobile-menu-scrim" aria-label="Cerrar menú" onClick={closeMenu} />}
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
