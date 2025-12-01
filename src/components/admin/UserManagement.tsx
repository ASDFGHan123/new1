import React from "react";
import { Search, Filter, MoreHorizontal, UserPlus, Printer } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openPrintWindow, generateUserListHTML } from "@/lib/printUtils";

interface User {
  id: string;
  username: string;
  email: string;
  status: "active" | "suspended" | "banned" | "pending";
  avatar?: string;
  role?: string;
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
}

interface UserManagementProps {
  users: User[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
  addUser?: (username: string, password: string, role: string, avatar?: string) => void;
  updateUser?: (id: string, updates: Partial<User>) => void;
  forceLogoutUser?: (id: string) => void;
  deleteUser?: (id: string) => void;
}

export const UserManagement = ({ users, approveUser, rejectUser, addUser, updateUser, forceLogoutUser, deleteUser }: UserManagementProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [confirmLogoutId, setConfirmLogoutId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRole, setNewRole] = React.useState("user");
  const [newAvatar, setNewAvatar] = React.useState<string | undefined>(undefined);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [showFilters, setShowFilters] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [editUsername, setEditUsername] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState("user");
  const [editAvatar, setEditAvatar] = React.useState<string | undefined>(undefined);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError("Username and password are required.");
      return;
    }
    if (users.some(u => u.username === newUsername)) {
      setError("Username already exists.");
      return;
    }
    if (users.some(u => u.email === `${newUsername}@example.com`)) {
      setError("Email already exists.");
      return;
    }
    if (addUser) {
      addUser(newUsername, newPassword, newRole, newAvatar);
      setOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("user");
      setNewAvatar(undefined);
      setError("");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role || "user");
    setEditAvatar(user.avatar);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Check if username is unique (excluding current user)
    if (editUsername !== editingUser.username && users.some(u => u.username === editUsername)) {
      alert("Username already exists.");
      return;
    }

    // Check if email is unique (excluding current user)
    if (editEmail !== editingUser.email && users.some(u => u.email === editEmail)) {
      alert("Email already exists.");
      return;
    }

    if (updateUser) {
      updateUser(editingUser.id, {
        username: editUsername,
        email: editEmail,
        role: editRole,
        avatar: editAvatar,
      });
      alert("User updated successfully.");
    }
    setEditingUser(null);
  };

  // Filter users by search, status, and role
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
              <Button className="bg-admin-primary hover:bg-admin-primary/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User</DialogTitle>
                <DialogDescription>Add a new user with a role and password. User will be approved by default.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select id="role" className="w-full border rounded-md p-2" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Profile Image (optional)</Label>
                  <ImageUpload value={newAvatar} onChange={setNewAvatar} />
                  <p className="text-xs text-muted-foreground mt-1">Upload an image or leave empty for system-generated avatar</p>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <DialogFooter>
                  <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90">Add</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information and settings.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-username">Username</Label>
                  <Input id="edit-username" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <select id="edit-role" className="w-full border rounded-md p-2" value={editRole} onChange={e => setEditRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label>Profile Image</Label>
                  <ImageUpload value={editAvatar} onChange={setEditAvatar} />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-admin-primary hover:bg-admin-primary/90">Save Changes</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by username or email..."
              className="pl-10 bg-input border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
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
                  >
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
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
                    <div>
                      <p className="font-medium text-foreground">{user.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {user.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                  {user.status === "active" && <Badge variant="default">Active</Badge>}
                  {user.status === "suspended" && <Badge variant="secondary">Suspended</Badge>}
                  {user.status === "banned" && <Badge variant="destructive">Banned</Badge>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {user.status === "pending" ? (
                      <>
                        <Button size="sm" variant="default" onClick={() => approveUser(user.id)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectUser(user.id)}>Reject</Button>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmLogoutId(user.id)}>Force Logout</Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteId(user.id)}>Delete</Button>
                  </div>
                  {/* Force Logout Confirmation Dialog */}
                  <Dialog open={confirmLogoutId === user.id} onOpenChange={open => !open && setConfirmLogoutId(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Force Logout</DialogTitle>
                        <DialogDescription>Are you sure you want to forcefully log out <b>{user.username}</b>?</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmLogoutId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { if (forceLogoutUser) forceLogoutUser(user.id); setConfirmLogoutId(null); }}>Force Logout</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {/* Delete Confirmation Dialog */}
                  <Dialog open={confirmDeleteId === user.id} onOpenChange={open => !open && setConfirmDeleteId(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Move to Trash</DialogTitle>
                        <DialogDescription>Are you sure you want to move <b>{user.username}</b> to trash? The user can be restored later from the Trash tab.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { if (deleteUser) deleteUser(user.id); setConfirmDeleteId(null); }}>Move to Trash</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};