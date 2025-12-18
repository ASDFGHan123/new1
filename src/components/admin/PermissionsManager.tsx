import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const defaultPermissions: Permission[] = [
        { id: '1', name: 'view_users', description: 'View user list', category: 'Users' },
        { id: '2', name: 'create_users', description: 'Create new users', category: 'Users' },
        { id: '3', name: 'edit_users', description: 'Edit user information', category: 'Users' },
        { id: '4', name: 'delete_users', description: 'Delete users', category: 'Users' },
        { id: '5', name: 'view_messages', description: 'View messages', category: 'Messages' },
        { id: '6', name: 'moderate_messages', description: 'Moderate messages', category: 'Messages' },
        { id: '7', name: 'view_analytics', description: 'View analytics', category: 'Analytics' },
        { id: '8', name: 'manage_settings', description: 'Manage system settings', category: 'Settings' },
      ];
      setPermissions(defaultPermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const categories = [...new Set(permissions.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Permissions</h2>
        <p className="text-muted-foreground">System permissions and access control</p>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.filter(p => p.category === category).map(perm => (
              <Card key={perm.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{perm.name.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                    <Badge variant="outline">{category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{perm.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
