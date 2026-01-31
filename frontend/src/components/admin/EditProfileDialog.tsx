import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { ProfileImageUpload } from './ProfileImageUpload';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  onProfileUpdated?: (updatedUser?: { avatar?: string }) => void;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated
}) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUpdated, setAvatarUpdated] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setEmail(user.username ? `${user.username}@offchat.com` : '');
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordsDoNotMatch'),
        variant: 'destructive'
      });
      return;
    }

    if (newPassword && !currentPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.currentPasswordRequired'),
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {};
      
      if (username !== user?.username) {
        payload.username = username;
      }
      
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const response = await apiService.updateProfile(payload);
      
      if (response.success) {
        toast({
          title: t('common.success'),
          description: t('admin.profileUpdated')
        });
        
        // Pass updated user data including new avatar if available
        const updatedUserData = newAvatarUrl ? { avatar: newAvatarUrl } : undefined;
        onProfileUpdated?.(updatedUserData);
        handleClose();
      } else {
        // Handle validation errors from backend
        const errorMsg = response.error || t('errors.failedToUpdate');
        throw new Error(errorMsg);
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.failedToUpdate'),
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAvatarUpdated(false);
    setNewAvatarUrl(undefined);
    onClose();
  };

  const hasChanges = username !== user?.username || newPassword || currentPassword || avatarUpdated;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.editProfile')}</DialogTitle>
          <DialogDescription>
            {t('admin.updateProfileInfo')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">{t('admin.profilePicture')}</Label>
            <div className="flex justify-center">
              <ProfileImageUpload
                currentImage={user?.avatar}
                username={user?.username}
                user={user}
                onImageUpdated={(newAvatarUrl) => {
                  setAvatarUpdated(true);
                  setNewAvatarUrl(newAvatarUrl);
                  onProfileUpdated?.({ avatar: newAvatarUrl });
                }}
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('admin.profileInformation')}</h3>
            <div className="space-y-2">
              <Label htmlFor="username">{t('common.username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('common.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">{t('admin.changePassword')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('admin.currentPassword')}</Label>
              <Input
                id="current-password"
                type="password"
                placeholder={t('admin.currentPassword')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">{t('admin.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                placeholder={t('admin.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('admin.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={t('admin.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? t('common.loading') : t('settings.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
