import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest, jsonBody } from '../lib/api';
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
    if (!window.confirm(`Delete ${user.email} and all owned itineraries?`)) return;
    await apiRequest<void>(`/admin/users/${user.id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function deleteTrip(trip: AdminItinerary) {
    if (!window.confirm(`Delete “${trip.title}”?`)) return;
    await apiRequest<void>(`/admin/itineraries/${trip.id}`, { method: 'DELETE' });
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  return (
    <div className="page-container">
      <header className="page-heading"><span className="eyebrow">Administration</span><h1>Platform overview</h1><p className="muted">Moderate accounts and itineraries with a complete audit trail.</p></header>
      <div className="stat-grid">
        <div className="stat-card"><span>Users</span><strong>{stats.data?.users ?? '—'}</strong></div>
        <div className="stat-card"><span>Itineraries</span><strong>{stats.data?.itineraries ?? '—'}</strong></div>
        <div className="stat-card"><span>Activities</span><strong>{stats.data?.entries ?? '—'}</strong></div>
      </div>
      <div className="tab-bar"><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button><button className={tab === 'itineraries' ? 'active' : ''} onClick={() => setTab('itineraries')}>Itineraries</button></div>
      {tab === 'users' ? (
        <div className="table-card">
          <table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>
            {users.data?.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.displayName}</strong><small>{user.email}</small></td>
                <td><select value={user.role} onChange={(e) => void updateUser(user.id, { role: e.target.value as Role })}><option value="USER">User</option><option value="ADMIN">Admin</option></select></td>
                <td><label className="switch-label"><input type="checkbox" checked={user.isActive} onChange={(e) => void updateUser(user.id, { isActive: e.target.checked })} /><span>{user.isActive ? 'Active' : 'Disabled'}</span></label></td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td><button className="button danger-ghost small" onClick={() => void deleteUser(user)}>Delete</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      ) : (
        <div className="table-card">
          <table><thead><tr><th>Itinerary</th><th>Owner</th><th>Dates</th><th>Sharing</th><th /></tr></thead><tbody>
            {trips.data?.map((trip) => (
              <tr key={trip.id}>
                <td><strong>{trip.title}</strong><small>{trip.destination}</small></td>
                <td><strong>{trip.ownerName}</strong><small>{trip.ownerEmail}</small></td>
                <td>{trip.startDate} — {trip.endDate}</td>
                <td>{trip.publicShareEnabled ? 'Enabled' : 'Disabled'}</td>
                <td><button className="button danger-ghost small" onClick={() => void deleteTrip(trip)}>Delete</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
