import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ModeratorAssignmentProps {
  userId: string;
  currentRole: string;
  onUpdate?: () => void;
}

export function ModeratorAssignment({ userId, currentRole, onUpdate }: ModeratorAssignmentProps) {
  const [moderatorRoleType, setModeratorRoleType] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [moderatorInfo, setModeratorInfo] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentRole === 'moderator') {
      fetchModeratorInfo();
    } else {
      setIsModerator(false);
      setModeratorInfo(null);
    }
  }, [userId, currentRole]);

  const fetchModeratorInfo = async () => {
    try {
      const response = await apiService.httpRequest('/admin/moderators/list_moderators/');
      if (response.success && response.data) {
        const mod = response.data.find((m: any) => m.user_id === userId);
        if (mod) {
          setIsModerator(true);
          setModeratorRoleType(mod.role.role_type);
          setModeratorInfo(mod);
        }
      }
    } catch (error) {
      console.error('Failed to fetch moderator info');
    }
  };

  const handleAssign = async () => {
    if (!moderatorRoleType) {
      toast({ title: 'Error', description: 'Please select a moderator role type' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.httpRequest('/admin/moderators/assign_moderator/', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          role_type: moderatorRoleType
        })
      });

      if (response.success) {
        toast({ title: 'Success', description: `User assigned as ${moderatorRoleType} moderator` });
        setIsModerator(true);
        fetchModeratorInfo();
        onUpdate?.();
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to assign' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to assign' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove moderator role?')) return;

    setLoading(true);
    try {
      const response = await apiService.httpRequest('/admin/moderators/remove_moderator/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.success) {
        toast({ title: 'Success', description: 'Moderator role removed' });
        setIsModerator(false);
        setModeratorRoleType('');
        setModeratorInfo(null);
        onUpdate?.();
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to remove moderator' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove moderator' });
    } finally {
      setLoading(false);
    }
  };

  if (currentRole === 'admin') {
    return <div className="text-sm text-gray-500">Cannot assign moderator role to admin</div>;
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-lg">Moderator Role</h3>

      {currentRole === 'moderator' && isModerator && moderatorInfo ? (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm"><strong>Current Role:</strong> {moderatorInfo.role.name}</p>
            <p className="text-sm"><strong>Warnings:</strong> {moderatorInfo.warnings_issued}</p>
            <p className="text-sm"><strong>Suspensions:</strong> {moderatorInfo.suspensions_issued}</p>
            <p className="text-sm"><strong>Bans:</strong> {moderatorInfo.bans_issued}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Change Moderator Role Type</label>
            <select
              value={moderatorRoleType}
              onChange={(e) => setModeratorRoleType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="junior">Junior Moderator</option>
              <option value="senior">Senior Moderator</option>
              <option value="lead">Lead Moderator</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAssign}
              disabled={loading || moderatorRoleType === moderatorInfo.role.role_type}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? 'Removing...' : 'Remove Role'}
            </button>
          </div>
        </div>
      ) : currentRole === 'user' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">This user is not a moderator. Assign a moderator role:</p>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Moderator Role Type</label>
            <select
              value={moderatorRoleType}
              onChange={(e) => setModeratorRoleType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choose role...</option>
              <option value="junior">Junior Moderator</option>
              <option value="senior">Senior Moderator</option>
              <option value="lead">Lead Moderator</option>
            </select>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
            {moderatorRoleType && (
              <>
                <p className="font-medium mb-2">Permissions:</p>
                {moderatorRoleType === 'junior' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>View users and conversations</li>
                    <li>Delete messages</li>
                    <li>Warn users</li>
                  </ul>
                )}
                {moderatorRoleType === 'senior' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>All Junior permissions</li>
                    <li>Suspend users</li>
                    <li>View audit logs</li>
                  </ul>
                )}
                {moderatorRoleType === 'lead' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>All Senior permissions</li>
                    <li>Ban users</li>
                    <li>Manage moderators</li>
                  </ul>
                )}
              </>
            )}
          </div>

          <button
            onClick={handleAssign}
            disabled={!moderatorRoleType || loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Assigning...' : 'Assign as Moderator'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">User role: {currentRole}</p>
      )}
    </div>
  );
}

export default ModeratorAssignment;
