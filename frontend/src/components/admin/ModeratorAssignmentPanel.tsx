import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ShieldOff, Settings, UserPlus } from 'lucide-react';
import { ModeratorPermissionsManager } from './ModeratorPermissionsManager';

export function ModeratorAssignmentPanel() {
  const [users, setUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleType, setRoleType] = useState('junior');
  const [loading, setLoading] = useState(false);
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchModerators();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.httpRequest<{ users: any[] }>('/users/all-users/');
      if (response.success && response.data?.users) {
        setUsers(response.data.users.filter((u: any) => u.role !== 'admin'));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users' });
    }
  };

  const fetchModerators = async () => {
    try {
      const response = await apiService.httpRequest<{ moderators: any[] }>('/admin/permissions/moderators/');
      if (response.success && response.data) {
        setModerators(response.data.moderators);
      }
    } catch (error) {
      console.error('Failed to load moderators:', error);
    }
  };

  const handleAssignModerator = async () => {
    if (!selectedUser) {
      toast({ title: 'Error', description: 'Please select a user' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.httpRequest('/admin/moderators/assign_moderator/', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          role_type: roleType
        }),
      });

      toast({
        title: 'Success',
        description: `${selectedUser.username} assigned as ${roleType} moderator`
      });

      setSelectedUser(null);
      setRoleType('junior');
      fetchModerators();
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as any)?.response?.data?.error || 'Failed to assign moderator'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModerator = async (userId: string) => {
    if (!window.confirm('Remove moderator role?')) return;

    try {
      await apiService.httpRequest('/admin/moderators/remove_moderator/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });

      toast({ title: 'Success', description: 'Moderator role removed' });
      fetchModerators();
      fetchUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove moderator' });
    }
  };

  const regularUsers = users.filter(u => u.role === 'user');

  if (permissionsUserId) {
    const moderator = moderators.find(m => m.user_id === permissionsUserId);
    if (!moderator) return null;
    return (
      <ModeratorPermissionsManager
        userId={permissionsUserId}
        username={moderator.username}
        currentPermissions={moderator.permissions || []}
        onClose={() => setPermissionsUserId(null)}
        onUpdate={() => {
          fetchModerators();
          setPermissionsUserId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign Moderator Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Moderator Role
          </CardTitle>
          <CardDescription>Promote a user to moderator with optional permissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            <Select value={selectedUser?.id || ''} onValueChange={(value) => {
              const user = regularUsers.find(u => u.id === value);
              setSelectedUser(user || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {regularUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role Type</label>
            <Select value={roleType} onValueChange={setRoleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior Moderator</SelectItem>
                <SelectItem value="senior">Senior Moderator</SelectItem>
                <SelectItem value="lead">Lead Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssignModerator}
            disabled={!selectedUser || loading}
            className="w-full"
          >
            {loading ? 'Assigning...' : 'Assign Moderator'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Moderators Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Current Moderators
          </CardTitle>
          <CardDescription>Manage moderator roles and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {moderators.length === 0 ? (
            <p className="text-muted-foreground">No moderators assigned yet</p>
          ) : (
            <div className="space-y-3">
              {moderators.map(mod => (
                <div key={mod.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <p className="font-medium">{mod.username}</p>
                    <p className="text-sm text-muted-foreground">{mod.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Permissions: {mod.permissions?.length || 0} assigned
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPermissionsUserId(mod.user_id)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Permissions
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveModerator(mod.user_id)}
                    >
                      <ShieldOff className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ModeratorAssignmentPanel;
