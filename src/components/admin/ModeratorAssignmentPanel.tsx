import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export function ModeratorAssignmentPanel() {
  const [users, setUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleType, setRoleType] = useState('junior');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchModerators();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users/');
      setUsers(response.data.filter(u => u.role !== 'admin'));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users' });
    }
  };

  const fetchModerators = async () => {
    try {
      const response = await api.get('/api/admin/moderators/list_moderators/');
      setModerators(response.data);
    } catch (error) {
      console.error('Failed to load moderators');
    }
  };

  const handleAssignModerator = async () => {
    if (!selectedUser) {
      toast({ title: 'Error', description: 'Please select a user' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/admin/moderators/assign_moderator/', {
        user_id: selectedUser.id,
        role_type: roleType
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
        description: error.response?.data?.error || 'Failed to assign moderator'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModerator = async (userId) => {
    if (!window.confirm('Remove moderator role?')) return;

    try {
      await api.post('/api/admin/moderators/remove_moderator/', {
        user_id: userId
      });

      toast({ title: 'Success', description: 'Moderator role removed' });
      fetchModerators();
      fetchUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove moderator' });
    }
  };

  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div className="space-y-6">
      {/* Assign Moderator Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Assign Moderator Role</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select User</label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = regularUsers.find(u => u.id === e.target.value);
                setSelectedUser(user);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choose a user...</option>
              {regularUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role Type</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="junior">Junior Moderator</option>
              <option value="senior">Senior Moderator</option>
              <option value="lead">Lead Moderator</option>
            </select>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            <p className="font-medium mb-2">Permissions:</p>
            {roleType === 'junior' && (
              <ul className="list-disc list-inside space-y-1">
                <li>View users and conversations</li>
                <li>Delete messages</li>
                <li>Warn users</li>
              </ul>
            )}
            {roleType === 'senior' && (
              <ul className="list-disc list-inside space-y-1">
                <li>All Junior permissions</li>
                <li>Suspend users</li>
                <li>View audit logs</li>
              </ul>
            )}
            {roleType === 'lead' && (
              <ul className="list-disc list-inside space-y-1">
                <li>All Senior permissions</li>
                <li>Ban users</li>
                <li>Manage other moderators</li>
              </ul>
            )}
          </div>

          <button
            onClick={handleAssignModerator}
            disabled={!selectedUser || loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Assigning...' : 'Assign Moderator'}
          </button>
        </div>
      </div>

      {/* Current Moderators Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Current Moderators</h2>
        
        {moderators.length === 0 ? (
          <p className="text-gray-500">No moderators assigned yet</p>
        ) : (
          <div className="space-y-3">
            {moderators.map(mod => (
              <div key={mod.id} className="flex items-center justify-between border p-3 rounded">
                <div>
                  <p className="font-medium">{mod.user}</p>
                  <p className="text-sm text-gray-600">{mod.role.name}</p>
                  <p className="text-xs text-gray-500">
                    Warnings: {mod.warnings_issued} | Suspensions: {mod.suspensions_issued} | Bans: {mod.bans_issued}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveModerator(mod.user_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModeratorAssignmentPanel;
