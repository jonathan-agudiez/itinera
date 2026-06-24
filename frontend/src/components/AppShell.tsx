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
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
        </button>
        <nav id="main-navigation" className={`topnav${menuOpen ? ' open' : ''}`} aria-label="Navegación principal">
          <NavLink to="/dashboard" onClick={closeMenu}><Icon name="briefcase" size={16} /><span>Viajes</span></NavLink>
          {user?.role === 'ADMIN' && <NavLink to="/admin" onClick={closeMenu}><Icon name="shield" size={16} /><span>Administración</span></NavLink>}
          <NavLink to="/account" onClick={closeMenu}><Icon name="user-round" size={16} /><span>Cuenta</span></NavLink>
          <button type="button" className="text-button" onClick={handleLogout}><Icon name="log-out" size={16} /><span>Cerrar sesión</span></button>
        </nav>
      </header>
      {menuOpen && <button type="button" className="mobile-menu-scrim" aria-label="Cerrar menú" onClick={closeMenu} />}
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
