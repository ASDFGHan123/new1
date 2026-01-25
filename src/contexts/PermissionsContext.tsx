import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiService } from '@/lib/api';

interface PermissionsContextType {
  role: 'admin' | 'moderator' | null;
  permissions: string[];
  can: (action: string) => boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<'admin' | 'moderator' | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[PermissionsProvider] Mounted');

  const can = (action: string) => permissions.includes(action);

  useEffect(() => {
    console.log('[Permissions] Fetching permissions...');
    apiService.httpRequest<{ role: 'admin' | 'moderator'; permissions: string[] }>('/admin/my-permissions/')
      .then(resp => {
        console.log('[Permissions] Response:', resp);
        if (resp.success && resp.data) {
          setRole(resp.data.role);
          // If moderator has no permissions, give minimal view permissions
          if (resp.data.role === 'moderator' && (!resp.data.permissions || resp.data.permissions.length === 0)) {
            setPermissions(['view_users']);
          } else {
            setPermissions(resp.data.permissions || []);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load permissions:', err);
        // On error, assume no permissions
        setPermissions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <PermissionsContext.Provider value={{ role, permissions, can, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
