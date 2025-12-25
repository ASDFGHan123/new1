import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api';
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
  isBuiltIn?: boolean;
}

export function PermissionsManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const { success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const permResponse = await apiService.httpRequest<any>('/users/permissions/');
      const rolesResponse = await apiService.httpRequest<any>('/users/groups/');
      
      if (permResponse.success && rolesResponse.success) {
        const permsData = permResponse.data;
        const rolesData = rolesResponse.data;
        
        // Transform permissions
        const transformedPerms = (permsData.results || permsData).map((p: any) => ({
          id: String(p.id),
          name: p.codename,
          description: p.name,
          category: p.content_type?.app_label || 'Other'
        }));
        
        // Transform roles
        const builtInRoles = ['User', 'Moderator', 'Admin'];
        const transformedRoles = (rolesData.results || rolesData).map((r: any) => ({
          id: r.id,
          name: r.name,
          permissions: (r.permissions || []).map((p: any) => String(p)),
          isBuiltIn: builtInRoles.includes(r.name)
        }));
        
        setPermissions(transformedPerms);
        setRoles(transformedRoles);
        if (transformedRoles.length > 0) {
          setSelectedRole(transformedRoles[0].id);
        }
      } else {
        throw new Error('Failed to fetch from backend');
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
      error('Failed to load permissions from backend');
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

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      const role = roles.find(r => r.id === selectedRole);
      
      const response = await apiService.httpRequest<any>(`/users/groups/${selectedRole}/`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions: role?.permissions.map(p => parseInt(p)) })
      });
      
      if (response.success) {
        setSuccessMsg('Permissions updated successfully');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      error('Failed to save permissions: ' + err);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roles.length <= 1) {
      error('Cannot delete', 'At least one role must exist');
      return;
    }
    try {
      const response = await apiService.httpRequest<any>(`/users/groups/${roleId}/`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setRoles(roles.filter(r => r.id !== roleId));
        if (selectedRole === roleId) {
          setSelectedRole(roles[0].id);
        }
        success('Role deleted', 'Role has been removed from database');
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      error('Failed to delete role');
    }
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
                onKeyPress={async (e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    const roleName = (e.target as HTMLInputElement).value;
                    try {
                      const response = await apiService.httpRequest<any>('/users/groups/', {
                        method: 'POST',
                        body: JSON.stringify({ name: roleName, permissions: [] })
                      });
                      
                      if (response.success) {
                        const newRole = response.data;
                        setRoles([...roles, {
                          id: newRole.id,
                          name: newRole.name,
                          permissions: newRole.permissions || []
                        }]);
                        setSelectedRole(newRole.id);
                        setShowDialog(false);
                        success('Role created', 'New role has been saved to database');
                      } else {
                        throw new Error(response.error);
                      }
                    } catch (err) {
                      console.error('Error creating role:', err);
                      error('Failed to create role');
                    }
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
            {currentRole && !currentRole.isBuiltIn && roles.length > 1 && (
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

      {currentRole && (
        <div className="flex justify-end gap-2">
          <Button onClick={handleSavePermissions}>Save Permissions</Button>
        </div>
      )}
      
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle className="h-5 w-5" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
