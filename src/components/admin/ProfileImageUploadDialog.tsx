import React from 'react';
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileImageUpload } from './ProfileImageUpload';

interface ProfileImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUpdated?: () => void;
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
}

export const ProfileImageUploadDialog: React.FC<ProfileImageUploadDialogProps> = ({
  isOpen,
  onClose,
  onImageUpdated,
  user
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('profile.updateProfilePicture')}</DialogTitle>
          <DialogDescription>
            {t('profile.uploadNewProfilePictureDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-6">
          <ProfileImageUpload
            user={user}
            currentImage={user?.avatar}
            onImageUpdated={onImageUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
