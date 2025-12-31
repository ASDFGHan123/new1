import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Activity,
  FileText,
  LogOut,
  User,
  Trash2,
  ShieldAlert,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ProfileImageUploadDialog } from "./ProfileImageUploadDialog";

const getSidebarItems = (t: (key: string) => string) => [
  { icon: LayoutDashboard, label: t('admin.dashboard'), value: "overview" },
  { icon: User, label: t('admin.profile'), value: "profile" },
  { icon: Users, label: t('admin.userManagement'), value: "users" },
  { icon: ShieldAlert, label: t('admin.moderation'), value: "moderation" },
  { icon: Activity, label: t('admin.conversations'), value: "conversations" },
  { icon: FileText, label: t('admin.auditLogs'), value: "audit" },
  { icon: Shield, label: t('admin.permissions'), value: "permissions" },
  { icon: Database, label: t('messages.backup'), value: "backup" },
  { icon: Settings, label: t('admin.settings'), value: "settings" },
  { icon: Trash2, label: t('admin.trash'), value: "trash" },
];

interface AdminSidebarProps {
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onImageUpdated?: () => void;
}

export const AdminSidebar = ({ user, activeTab = "overview", onTabChange, onLogout, onImageUpdated }: AdminSidebarProps) => {
  const { t } = useTranslation();
  const [showImageUpload, setShowImageUpload] = useState(false);
  const sidebarItems = getSidebarItems(t);

  const handleImageUpdated = () => {
    setShowImageUpload(false);
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div>
          <h2 className="text-lg font-semibold text-sidebar-foreground">OffChat</h2>
          <p className="text-xs text-sidebar-foreground/60">{t('admin.adminPortal')}</p>
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
            <p className="text-sm font-medium text-sidebar-foreground">{user?.username || t('admin.adminUser')}</p>
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
          {t('admin.signOut')}
        </Button>
      </div>
    </div>
  );
};
