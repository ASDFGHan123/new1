import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, MoreHorizontal, UserPlus, Printer, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openPrintWindow, generateUserListHTML } from "@/lib/printUtils";
import { apiService, type User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invalidateUsersCache } from "@/hooks/useApiData";

interface UserManagementProps {
  users?: User[];
  approveUser?: (userId: string) => void;
  rejectUser?: (userId: string) => void;
  addUser?: (username: string, password: string, role: string, avatar?: string) => void;
  updateUser?: (userId: string, updates: Partial<User>) => void;
  forceLogoutUser?: (userId: string) => void;
  deleteUser?: (userId: string) => void;
  onUserDeleted?: () => void;
}

export const UserManagement = React.memo(({ users: propUsers = [], approveUser, rejectUser, addUser, updateUser, forceLogoutUser, deleteUser, onUserDeleted }: UserManagementProps) => {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>(propUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newAvatar, setNewAvatar] = useState<string | undefined>(undefined);
  const [addLoading, setAddLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editAvatar, setEditAvatar] = useState<string | undefined>(undefined);
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const loadUsers = useCallback(async (retryAttempt = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUsers();
      
      if (response.success && response.data) {
        setUsers(response.data);
        setRetryCount(0);
      } else {
        throw new Error(response.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      
      if (retryAttempt < 3) {
        setTimeout(() => {
          loadUsers(retryAttempt + 1);
          setRetryCount(retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = () => {
    loadUsers();
  };

  const approveUserInternal = async (userId: string) => {
    if (approveUser) {
      approveUser(userId);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await apiService.approveUser(userId);
      
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: "active" } : user
        ));
        
        toast({
          title: "User Approved",
          description: "User has been successfully approved.",
        });
      } else {
        throw new Error(response.error || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Failed to approve user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to approve user',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const rejectUserInternal = async (userId: string) => {
    if (rejectUser) {
      rejectUser(userId);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await apiService.deleteUser(userId);
      
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        invalidateUsersCache();
        onUserDeleted?.();
        
        toast({
          title: "User Rejected",
          description: "User has been rejected and removed.",
        });
      } else {
        throw new Error(response.error || 'Failed to reject user');
      }
    } catch (err) {
      console.error('Failed to reject user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to reject user',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const forceLogoutUserInternal = async (userId: string) => {
    if (forceLogoutUser) {
      forceLogoutUser(userId);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await apiService.forceLogoutUser(userId);
      
      if (response.success) {
        toast({
          title: "User Logged Out",
          description: "User has been forcefully logged out.",
        });
      } else {
        throw new Error(response.error || 'Failed to force logout user');
      }
    } catch (err) {
      console.error('Failed to force logout user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to force logout user',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUserInternal = async (userId: string, moveToTrash: boolean = true) => {
    if (deleteUser) {
      deleteUser(userId);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await apiService.httpRequest(`/users/admin/users/${userId}/?permanent=${!moveToTrash}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        invalidateUsersCache();
        onUserDeleted?.();
        
        toast({
          title: moveToTrash ? "User Moved to Trash" : "User Permanently Deleted",
          description: moveToTrash ? "User has been moved to trash." : "User has been permanently deleted.",
        });
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete user',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword) {
      setFormError("Username and password are required.");
      return;
    }
    
    if (users.some(u => u.username === newUsername)) {
      setFormError("Username already exists.");
      return;
    }
    
    setAddLoading(true);
    setFormError("");
    
    try {
      const response = await apiService.createUser({
        username: newUsername,
        email: newEmail || `${newUsername}@offchat.local`,
        password: newPassword,
        role: newRole,
        status: 'active'
      });
      
      if (response.success && response.data) {
        setUsers(prev => [...prev, response.data]);
        invalidateUsersCache();
        setOpen(false);
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("user");
        setNewAvatar(undefined);
        
        toast({
          title: "User Created",
          description: "New user has been created successfully.",
        });
      } else {
        throw new Error(response.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role || "user");
    setEditAvatar(user.avatar);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    if (editUsername !== editingUser.username && users.some(u => u.username === editUsername)) {
      setFormError("Username already exists.");
      return;
    }

    if (editEmail !== editingUser.email && users.some(u => u.email === editEmail)) {
      setFormError("Email already exists.");
      return;
    }

    setEditLoading(true);
    setFormError("");
    
    try {
      if (updateUser) {
        updateUser(editingUser.id, {
          username: editUsername,
          email: editEmail,
          role: editRole,
          avatar: editAvatar,
        });
        
        setEditingUser(null);
        
        toast({
          title: "User Updated",
          description: "User has been updated successfully.",
        });
      } else {
        const response = await apiService.updateUser(editingUser.id, {
          username: editUsername,
          email: editEmail,
          role: editRole,
          avatar: editAvatar,
        });
        
        if (response.success) {
          setUsers(prev => prev.map(user => 
            user.id === editingUser.id 
              ? { ...user, username: editUsername, email: editEmail, role: editRole, avatar: editAvatar }
              : user
          ));
          invalidateUsersCache();
          
          setEditingUser(null);
          
          toast({
            title: "User Updated",
            description: "User has been updated successfully.",
          });
        } else {
          throw new Error(response.error || 'Failed to update user');
        }
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handlePrintUsers = () => {
    const printData = generateUserListHTML(filteredUsers);
    openPrintWindow({
      ...printData,
      subtitle: `Filtered Results: ${filteredUsers.length} of ${users.length} users`
    });
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {error && (
              <Alert variant="destructive" className="mr-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={retryCount >= 3}
                    className="ml-2"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                    Retry ({retryCount}/3)
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handlePrintUsers}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Users
            </Button>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-admin-primary hover:bg-admin-primary/90" disabled={loading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                  <DialogDescription>Add a new user with a role and password.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={newUsername} 
                      onChange={e => setNewUsername(e.target.value)} 
                      required 
                      disabled={addLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      placeholder={`${newUsername || 'username'}@offchat.local`}
                      disabled={addLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      disabled={addLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select 
                      id="role" 
                      className="w-full border rounded-md p-2" 
                      value={newRole} 
                      onChange={e => setNewRole(e.target.value)}
                      disabled={addLoading}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label>Profile Image (Optional)</Label>
                    <ImageUpload value={newAvatar} onChange={setNewAvatar} disabled={addLoading} />
                  </div>
                  {formError && <div className="text-red-500 text-sm">{formError}</div>}
                  <DialogFooter>
                    <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90" disabled={addLoading}>
                      {addLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {addLoading ? 'Creating...' : 'Add'}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={addLoading}>Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user information and settings.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-username">Username</Label>
                    <Input 
                      id="edit-username" 
                      value={editUsername} 
                      onChange={e => setEditUsername(e.target.value)} 
                      required 
                      disabled={editLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={editEmail} 
                      onChange={e => setEditEmail(e.target.value)} 
                      required 
                      disabled={editLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role">Role</Label>
                    <select 
                      id="edit-role" 
                      className="w-full border rounded-md p-2" 
                      value={editRole} 
                      onChange={e => setEditRole(e.target.value)}
                      disabled={editLoading}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label>Profile Image</Label>
                    <ImageUpload value={editAvatar} onChange={setEditAvatar} disabled={editLoading} />
                  </div>
                  {formError && <div className="text-red-500 text-sm">{formError}</div>}
                  <DialogFooter>
                    <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90" disabled={editLoading}>
                      {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={editLoading}>Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by username or email..."
              className="pl-10 bg-input border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(statusFilter !== "all" || roleFilter !== "all") && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-2 h-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setRoleFilter("all");
                    }}
                    disabled={loading}
                  >
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)} disabled={loading}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
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
                        <Badge variant="outline">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}</Badge>
                        {user.online_status && (
                          <Badge variant={user.online_status === 'online' ? 'default' : 'secondary'} className="ml-1">
                            {user.online_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {user.status === "pending" ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="default" 
                                onClick={() => approveUserInternal(user.id)}
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
                                onClick={() => rejectUserInternal(user.id)}
                                disabled={actionLoading[user.id]}
                              >
                                {actionLoading[user.id] ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : null}
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditUser(user)}
                            disabled={loading || actionLoading[user.id]}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => forceLogoutUserInternal(user.id)}
                            disabled={actionLoading[user.id]}
                          >
                            Force Logout
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => {
                              setUserToDelete(user.id);
                              setDeleteConfirmOpen(true);
                            }}
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
            </div>
            
            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found matching your filters.</p>
              </div>
            )}
          </>
        )}
        
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>Choose how to delete this user</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                onClick={() => {
                  if (userToDelete) deleteUserInternal(userToDelete, true);
                }}
                disabled={actionLoading[userToDelete || '']}
              >
                {actionLoading[userToDelete || ''] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Move to Trash
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (userToDelete) deleteUserInternal(userToDelete, false);
                }}
                disabled={actionLoading[userToDelete || '']}
              >
                {actionLoading[userToDelete || ''] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Permanently Delete
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={actionLoading[userToDelete || '']}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
});
