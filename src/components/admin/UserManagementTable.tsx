import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { User, apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface UserManagementTableProps {
  filteredUsers: User[];
  userDepartments: { [key: string]: any };
  actionLoading: { [key: string]: boolean };
  can: (action: string) => boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onEdit: (user: User) => void;
  onForceLogout: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export function UserManagementTable({
  filteredUsers,
  userDepartments,
  actionLoading,
  can,
  onApprove,
  onReject,
  onEdit,
  onForceLogout,
  onDelete,
}: UserManagementTableProps) {
  const { toast } = useToast();
  const [avatarTimestamps, setAvatarTimestamps] = useState<{ [key: string]: number }>({});

  // Function to get avatar URL with cache-busting
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    const timestamp = avatarTimestamps[avatar] || Date.now();
    return `${avatar}?t=${timestamp}`;
  };

  // Function to refresh avatar for a specific user
  const refreshAvatar = (userId: string, avatar?: string) => {
    if (avatar) {
      setAvatarTimestamps(prev => ({
        ...prev,
        [avatar]: Date.now()
      }));
    }
  };

  // Listen for user updates and refresh avatars
  useEffect(() => {
    // Create a map of current avatar URLs to timestamps
    const newTimestamps: { [key: string]: number } = {};
    
    filteredUsers.forEach(user => {
      if (user.avatar) {
        // Always use a fresh timestamp to ensure the latest image is loaded
        newTimestamps[user.avatar] = Date.now();
      }
    });
    
    // Update timestamps if they've changed
    const hasChanges = Object.keys(newTimestamps).some(avatar => 
      avatarTimestamps[avatar] !== newTimestamps[avatar]
    );
    
    if (hasChanges) {
      setAvatarTimestamps(newTimestamps);
    }
  }, [filteredUsers]); // Only depend on filteredUsers

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Account Status</TableHead>
          <TableHead>Online Status</TableHead>
          <TableHead>Department / Office</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={getAvatarUrl(user.avatar)} />
                  <AvatarFallback />
                </Avatar>
                <p className="font-medium text-foreground">{user.username}</p>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm">{user.join_date ? new Date(user.join_date).toLocaleDateString() : user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </TableCell>
            <TableCell>
              {user.is_active ? (
                <Badge variant="default">Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  user.online_status === 'online' ? 'bg-green-500' :
                  user.online_status === 'away' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <Badge variant={user.online_status === 'online' ? 'default' : user.online_status === 'away' ? 'secondary' : 'outline'}>
                  {user.online_status === 'online' ? 'Online' :
                   user.online_status === 'away' ? 'Away' :
                   'Offline'}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {userDepartments[user.id] && userDepartments[user.id].length > 0 ? (
                  <div className="space-y-1">
                    {userDepartments[user.id].map((dept: any, idx: number) => (
                      <div key={idx} className="text-xs">
                        <p className="font-medium">{dept.department}</p>
                        <p className="text-muted-foreground">{dept.office}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2 flex-wrap">
                {user.status === "pending" && can('approve_user') ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => onApprove(user.id)}
                      disabled={actionLoading[user.id]}
                    >
                      {actionLoading[user.id] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => onReject(user.id)}
                      disabled={actionLoading[user.id]}
                    >
                      {actionLoading[user.id] ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Reject
                    </Button>
                  </>
                ) : null}
                {can('edit_user') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onEdit(user)}
                    disabled={actionLoading[user.id]}
                  >
                    Edit
                  </Button>
                )}
                {can('force_logout_user') && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onForceLogout(user.id)}
                    disabled={actionLoading[user.id]}
                  >
                    Force Logout
                  </Button>
                )}
                {can('delete_user') && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => onDelete(user.id)}
                    disabled={actionLoading[user.id]}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
