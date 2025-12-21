import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      
      const defaultRoles: Role[] = [
        { id: '1', name: 'User', permissions: ['1', '5', '7'] },
        { id: '2', name: 'Moderator', permissions: ['1', '5', '6', '7'] },
        { id: '3', name: 'Admin', permissions: ['1', '2', '3', '4', '5', '6', '7', '8'] },
      ];
      
      setPermissions(defaultPermissions);
      setRoles(defaultRoles);
      setSelectedRole(defaultRoles[0].id);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRole) return;
    
    setRoles(roles.map(role => {
      if (role.id === selectedRole) {
        const newPermissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId];
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
  };

  const handleSavePermissions = () => {
    success('Permissions updated', 'Role permissions have been saved');
  };

  const handleDeleteRole = (roleId: string) => {
    if (roles.length <= 1) {
      error('Cannot delete', 'At least one role must exist');
      return;
    }
    setRoles(roles.filter(r => r.id !== roleId));
    if (selectedRole === roleId) {
      setSelectedRole(roles[0].id);
    }
    success('Role deleted', 'Role has been removed');
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const currentRole = roles.find(r => r.id === selectedRole);
  const categories = [...new Set(permissions.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Permissions</h2>
          <p className="text-muted-foreground">Manage role permissions and access control</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Add a new role to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Role name"
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    const newRole: Role = {
                      id: Date.now().toString(),
                      name: (e.target as HTMLInputElement).value,
                      permissions: []
                    };
                    setRoles([...roles, newRole]);
                    setSelectedRole(newRole.id);
                    setShowDialog(false);
                    success('Role created', 'New role has been added');
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentRole && roles.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRole(selectedRole)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.filter(p => p.category === category).map(perm => {
                const isChecked = currentRole?.permissions.includes(perm.id) || false;
                return (
                  <Card 
                    key={perm.id} 
                    className={cn(
                      'transition-colors',
                      isChecked && 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handlePermissionToggle(perm.id)}
                          />
                          <CardTitle className="text-sm">{perm.name.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                        </div>
                        <Badge variant="outline">{category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{perm.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => fetchData()}>Reset</Button>
        <Button onClick={handleSavePermissions}>Save Permissions</Button>
      </div>
    </div>
  );
}
