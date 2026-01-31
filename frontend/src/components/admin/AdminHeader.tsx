import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationCenter } from '@/components/NotificationCenter';
import { EditProfileDialog } from './EditProfileDialog';
import { LogOut, Settings } from 'lucide-react';

interface AdminHeaderProps {
  user?: { 
    id: string; 
    username: string; 
    avatar?: string; 
    status: "online" | "away" | "offline"; 
    role?: string; 
  };
  onLogout?: () => void;
  onProfileUpdate?: (updatedUser?: { avatar?: string }) => void;
}

export function AdminHeader({ user, onLogout, onProfileUpdate }: AdminHeaderProps) {
  const { t } = useTranslation();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const [forceRefresh, setForceRefresh] = useState(0);
  const [uniqueId, setUniqueId] = useState(Math.random().toString(36).substr(2, 9));
  const [currentUser, setCurrentUser] = useState(user); // Local copy of user
  const avatarImageRef = useRef<HTMLImageElement>(null); // Ref to avatar image

  // Update local user when prop changes
  useEffect(() => {
    console.log('AdminHeader: User prop changed:', user?.username, user?.avatar);
    setCurrentUser(user);
  }, [user]);

  // Debug: Log when user prop changes
  useEffect(() => {
    console.log('AdminHeader: Local user state changed:', currentUser?.username, currentUser?.avatar);
  }, [currentUser]);

  const handleProfileUpdate = (updatedUser?: { avatar?: string }) => {
    console.log('AdminHeader: Profile update received', updatedUser);
    
    // Immediately update local user state if avatar provided
    if (updatedUser?.avatar && currentUser) {
      const updatedLocalUser = { ...currentUser, avatar: updatedUser.avatar };
      console.log('AdminHeader: Updating local user state:', updatedLocalUser);
      setCurrentUser(updatedLocalUser);
      
      // Force direct DOM manipulation as backup
      setTimeout(() => {
        if (avatarImageRef.current) {
          console.log('AdminHeader: Forcing direct DOM avatar reload');
          avatarImageRef.current.src = `${updatedUser.avatar}?t=${Date.now()}&force=direct`;
          avatarImageRef.current.onload = () => {
            console.log('AdminHeader: Direct DOM avatar loaded successfully');
          };
        }
      }, 50);
    }
    
    // Force multiple refreshes to ensure avatar updates
    const now = Date.now();
    setAvatarTimestamp(now);
    setForceRefresh(prev => prev + 1);
    setUniqueId(Math.random().toString(36).substr(2, 9)); // Generate new unique ID
    
    // Call parent update
    onProfileUpdate?.(updatedUser);
    
    // Force multiple refreshes at different intervals
    setTimeout(() => {
      setAvatarTimestamp(now + 1);
      setForceRefresh(prev => prev + 1);
      setUniqueId(Math.random().toString(36).substr(2, 9));
    }, 100);
    
    setTimeout(() => {
      setAvatarTimestamp(now + 2);
      setForceRefresh(prev => prev + 1);
      setUniqueId(Math.random().toString(36).substr(2, 9));
    }, 300);
    
    setTimeout(() => {
      setAvatarTimestamp(now + 3);
      setForceRefresh(prev => prev + 1);
      setUniqueId(Math.random().toString(36).substr(2, 9));
    }, 500);
  };

  // Update avatar timestamp when user avatar changes
  useEffect(() => {
    console.log('AdminHeader: useEffect triggered, user.avatar:', user?.avatar);
    if (user?.avatar) {
      console.log('AdminHeader: User avatar changed, updating timestamp');
      setAvatarTimestamp(Date.now());
    }
  }, [user?.avatar]);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">{t('admin.adminDashboard')}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationCenter />
          
          {currentUser && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    ref={avatarImageRef}
                    src={currentUser.avatar ? `${currentUser.avatar}?t=${avatarTimestamp}&r=${forceRefresh}&u=${uniqueId}` : undefined} 
                    onLoad={() => {
                      console.log('AdminHeader: Avatar image loaded with URL:', currentUser.avatar ? `${currentUser.avatar}?t=${avatarTimestamp}&r=${forceRefresh}&u=${uniqueId}` : 'no avatar');
                    }}
                  />
                  <AvatarFallback />
                </Avatar>
                <Badge variant="secondary" className="text-xs">
                  {currentUser.role || t('users.admin')}
                </Badge>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <EditProfileDialog
              isOpen={showEditProfile}
              onClose={() => setShowEditProfile(false)}
              user={currentUser as any}
              onProfileUpdated={handleProfileUpdate}
            /> 
    </header>
  );
}
