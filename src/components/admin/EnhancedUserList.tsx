import React from "react";
import { Search, Filter, Eye, Shield, Database, MoreHorizontal, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { openPrintWindow, generateEnhancedUserListHTML } from "@/lib/printUtils";
import { User } from "@/lib/api";

interface EnhancedUserListProps {
  users: User[];
  onViewProfile: (user: User) => void;
  onModerate: (user: User) => void;
  onDataManagement: (user: User) => void;
}

export const EnhancedUserList = ({ users, onViewProfile, onModerate, onDataManagement }: EnhancedUserListProps) => {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "suspended": return "secondary";
      case "banned": return "destructive";
      default: return "outline";
    }
  };

  const handlePrintUserList = () => {
    const printData = generateEnhancedUserListHTML(filteredUsers);
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
            <CardDescription>Find and manage users with advanced filtering</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handlePrintUserList}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print User List
            </Button>
            <Badge variant="outline">{filteredUsers.length} users</Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Reports</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback />
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>{(user.message_count || 0).toLocaleString()}</TableCell>
                <TableCell>
                  {user.report_count > 0 ? (
                    <Badge variant="destructive">{user.report_count}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Never'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewProfile(user)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onModerate(user)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Moderate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDataManagement(user)}>
                        <Database className="w-4 h-4 mr-2" />
                        Data Tools
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};