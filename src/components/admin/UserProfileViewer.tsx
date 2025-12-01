import React from "react";
import { User, Mail, Calendar, Shield, Activity, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "banned";
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
  avatar?: string;
}

interface UserProfileViewerProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onExportData: (userId: string) => void;
  onDeleteData: (userId: string) => void;
  onTrashUser?: (userId: string) => void;
}

export const UserProfileViewer = ({ user, isOpen, onClose, onExportData, onDeleteData, onTrashUser }: UserProfileViewerProps) => {
  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "suspended": return "secondary";
      case "banned": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.username}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Join Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{user.joinDate}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Last Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{user.lastActive}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Messages Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{user.messageCount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-red-500">{user.reportCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Management</CardTitle>
              <CardDescription>Export or delete user data for compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExportData(user.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                {onTrashUser && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Move User to Trash</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to move {user.username} to trash? The user can be restored later from the Trash tab.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onTrashUser(user.id);
                            onClose();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Move to Trash
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDeleteData(user.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};