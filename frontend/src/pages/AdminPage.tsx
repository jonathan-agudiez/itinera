import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest, jsonBody } from '../lib/api';
import { formatDate, formatDateRange } from '../lib/dates';
import { roleLabels } from '../lib/labels';
import type { Role } from '../types';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface AdminItinerary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  publicShareEnabled: boolean;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  updatedAt: string;
}

export function AdminPage() {
  const [tab, setTab] = useState<'users' | 'itineraries'>('users');
  const queryClient = useQueryClient();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => apiRequest<{ users: number; itineraries: number; entries: number }>('/admin/stats') });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: async () => (await apiRequest<{ users: AdminUser[] }>('/admin/users')).users });
  const trips = useQuery({ queryKey: ['admin', 'itineraries'], queryFn: async () => (await apiRequest<{ itineraries: AdminItinerary[] }>('/admin/itineraries')).itineraries });

  async function updateUser(userId: string, input: Partial<Pick<AdminUser, 'role' | 'isActive'>>) {
    await apiRequest(`/admin/users/${userId}`, { method: 'PATCH', ...jsonBody(input) });
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`¿Eliminar ${user.email} y todos sus itinerarios?`)) return;
    await apiRequest<void>(`/admin/users/${user.id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function deleteTrip(trip: AdminItinerary) {
    if (!window.confirm(`¿Eliminar “${trip.title}”?`)) return;
    await apiRequest<void>(`/admin/itineraries/${trip.id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  return (
    <div className="page-container">
      <header className="page-heading"><span className="eyebrow">Administración</span><h1>Resumen de la plataforma</h1><p className="muted">Gestiona cuentas e itinerarios con un registro de auditoría completo.</p></header>
      <div className="stat-grid">
        <div className="stat-card"><span>Usuarios</span><strong>{stats.data?.users ?? '—'}</strong></div>
        <div className="stat-card"><span>Itinerarios</span><strong>{stats.data?.itineraries ?? '—'}</strong></div>
        <div className="stat-card"><span>Actividades</span><strong>{stats.data?.entries ?? '—'}</strong></div>
      </div>
      <div className="tab-bar"><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Usuarios</button><button className={tab === 'itineraries' ? 'active' : ''} onClick={() => setTab('itineraries')}>Itinerarios</button></div>
      {tab === 'users' ? (
        <div className="table-card">
          <table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th /></tr></thead><tbody>
            {users.data?.map((user) => (
              <tr key={user.id}>
                <td data-label="Usuario"><strong>{user.displayName}</strong><small>{user.email}</small></td>
                <td data-label="Rol"><select value={user.role} onChange={(event) => void updateUser(user.id, { role: event.target.value as Role })}><option value="USER">{roleLabels.USER}</option><option value="ADMIN">{roleLabels.ADMIN}</option></select></td>
                <td data-label="Estado"><label className="switch-label"><input type="checkbox" checked={user.isActive} onChange={(event) => void updateUser(user.id, { isActive: event.target.checked })} /><span>{user.isActive ? 'Activo' : 'Desactivado'}</span></label></td>
                <td data-label="Creado">{formatDate(user.createdAt.slice(0, 10))}</td>
                <td data-label="Acciones"><button className="button danger-ghost small" onClick={() => void deleteUser(user)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      ) : (
        <div className="table-card">
          <table><thead><tr><th>Itinerario</th><th>Propietario</th><th>Fechas</th><th>Compartido</th><th /></tr></thead><tbody>
            {trips.data?.map((trip) => (
              <tr key={trip.id}>
                <td data-label="Itinerario"><strong>{trip.title}</strong><small>{trip.destination}</small></td>
                <td data-label="Propietario"><strong>{trip.ownerName}</strong><small>{trip.ownerEmail}</small></td>
                <td data-label="Fechas">{formatDateRange(trip.startDate, trip.endDate)}</td>
                <td data-label="Compartido">{trip.publicShareEnabled ? 'Activado' : 'Desactivado'}</td>
                <td data-label="Acciones"><button className="button danger-ghost small" onClick={() => void deleteTrip(trip)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
