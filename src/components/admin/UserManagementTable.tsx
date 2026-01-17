import React, { useState } from 'react';
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
  onApprove,
  onReject,
  onEdit,
  onForceLogout,
  onDelete,
}: UserManagementTableProps) {
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleToggleOnlineStatus = async (userId: string, currentStatus: string) => {
    setStatusLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const newStatus = currentStatus === 'online' ? 'offline' : 'online';
      const response = await apiService.setUserOnlineStatus(userId, newStatus as 'online' | 'offline');
      
      if (response.success) {
        toast({
          title: 'Status Updated',
          description: `User status set to ${newStatus}`,
        });
        onEdit({ ...filteredUsers.find(u => u.id === userId)!, online_status: newStatus as any });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setStatusLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

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
                  <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
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
                {user.status === "pending" ? (
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onEdit(user)}
                  disabled={actionLoading[user.id]}
                >
                  Edit
                </Button>
                {user.is_active ? (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      const updatedUser = { ...user, is_active: false };
                      onEdit(updatedUser);
                    }}
                    disabled={actionLoading[user.id]}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="default" 
                    onClick={() => {
                      const updatedUser = { ...user, is_active: true };
                      onEdit(updatedUser);
                    }}
                    disabled={actionLoading[user.id]}
                  >
                    Activate
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleToggleOnlineStatus(user.id, user.online_status)}
                  disabled={statusLoading[user.id]}
                >
                  {statusLoading[user.id] ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : null}
                  Set {user.online_status === 'online' ? 'Offline' : 'Online'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onForceLogout(user.id)}
                  disabled={actionLoading[user.id]}
                >
                  Force Logout
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onDelete(user.id)}
                  disabled={actionLoading[user.id]}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
