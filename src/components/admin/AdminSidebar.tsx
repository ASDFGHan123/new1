import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  Shield,
  Activity,
  FileText,
  LogOut,
  User,
  Trash2,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ProfileImageUploadDialog } from "./ProfileImageUploadDialog";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", value: "overview" },
  { icon: User, label: "Profile", value: "profile" },
  { icon: Users, label: "User Management", value: "users" },
  { icon: ShieldAlert, label: "Moderation", value: "moderation" },
  { icon: MessageSquare, label: "Messages", value: "messages" },
  { icon: Activity, label: "Conversations", value: "conversations" },
  { icon: FileText, label: "Audit Logs", value: "audit" },
  { icon: Shield, label: "Permissions", value: "permissions" },
  { icon: Settings, label: "Settings", value: "settings" },
  { icon: Trash2, label: "Trash", value: "trash" },
];

interface AdminSidebarProps {
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onImageUpdated?: () => void;
}

export const AdminSidebar = ({ user, activeTab = "overview", onTabChange, onLogout, onImageUpdated }: AdminSidebarProps) => {
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageUpdated = () => {
    setShowImageUpload(false);
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">OffChat</h2>
          <p className="text-xs text-sidebar-foreground/60">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => onTabChange?.(item.value)}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeTab === item.value && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className="flex items-center space-x-3 mb-3 cursor-pointer hover:bg-sidebar-accent/50 p-2 rounded"
          onClick={() => setShowImageUpload(true)}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar ? `${user.avatar}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'admin'}`} />
            <AvatarFallback className="bg-admin-primary text-primary-foreground">
              {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.username || 'Admin User'}</p>
            <p className="text-xs text-sidebar-foreground/60">{user?.username ? `${user.username}@offchat.com` : 'admin@offchat.com'}</p>
          </div>
        </div>
        <ProfileImageUploadDialog
          key={user?.avatar}
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onImageUpdated={handleImageUpdated}
          user={user}
        />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
