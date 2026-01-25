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
  Database,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ProfileImageUploadDialog } from "./ProfileImageUploadDialog";
import { usePermissions } from "@/contexts/PermissionsContext";

const getSidebarItems = (t: (key: string) => string, can: (action: string) => boolean) => [
  { icon: LayoutDashboard, label: t('admin.dashboard'), value: "overview", permission: null },
  { icon: User, label: t('admin.profile'), value: "profile", permission: null },
  { icon: Users, label: t('admin.userManagement'), value: "users", permission: 'view_users' },
  { icon: Building2, label: t('departments.departments'), value: "departments", permission: null }, // TODO: add permission if needed
  { icon: ShieldAlert, label: t('admin.moderation'), value: "moderation", permission: null }, // TODO: add permission if needed
  { icon: Activity, label: t('admin.conversations'), value: "conversations", permission: 'view_conversations' },
  { icon: FileText, label: t('admin.auditLogs'), value: "audit", permission: 'view_audit_logs' },
  { icon: Shield, label: t('admin.permissions'), value: "permissions", permission: 'view_moderators' },
  { icon: Database, label: t('messages.backup'), value: "backup", permission: 'view_backups' },
  { icon: Settings, label: t('admin.settings'), value: "settings", permission: 'view_settings' },
  { icon: Trash2, label: t('admin.trash'), value: "trash", permission: null }, // TODO: add permission if needed
].filter(item => !item.permission || can(item.permission));

interface AdminSidebarProps {
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onImageUpdated?: () => void;
}

export const AdminSidebar = ({ user, activeTab = "overview", onTabChange, onLogout, onImageUpdated }: AdminSidebarProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [showImageUpload, setShowImageUpload] = useState(false);
  const sidebarItems = getSidebarItems(t, can);

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
