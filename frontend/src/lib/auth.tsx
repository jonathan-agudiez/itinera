import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import { apiRequest } from './api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await apiRequest<{ user: User }>('/auth/me')).user,
    retry: false,
    staleTime: 60_000,
  });

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  }

  async function logout(): Promise<void> {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        loading: query.isLoading,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
