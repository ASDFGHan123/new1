import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { User } from '@/lib/api';

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Status</TableHead>
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
              {user.status === "pending" && <Badge variant="secondary">Pending</Badge>}
              {user.status === "active" && <Badge variant="default">Active</Badge>}
              {user.status === "suspended" && <Badge variant="secondary">Suspended</Badge>}
              {user.status === "banned" && <Badge variant="destructive">Banned</Badge>}
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
