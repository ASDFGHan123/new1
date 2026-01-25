import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService, API_BASE_URL } from '@/lib/api';
import { useTranslation } from "react-i18next";

interface ProfileImageUploadProps {
  currentImage?: string;
  username?: string;
  onImageUpdated?: () => void;
  user?: { id: string; username: string; avatar?: string; status: "online" | "away" | "offline"; role?: string };
  isOpen?: boolean;
  onClose?: () => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  username,
  onImageUpdated,
  user,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const displayUsername = username || user?.username || 'Admin';
  const serverBaseUrl = API_BASE_URL.replace(/\/?api\/?$/, '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    currentImage?.startsWith('http') ? currentImage : 
    currentImage ? `${serverBaseUrl}${currentImage}` : undefined
  );
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('File selected:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('profile.invalidFile'),
        description: t('profile.pleaseSelectImageFile'),
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('profile.fileTooLarge'),
        description: t('profile.pleaseSelectImageSmallerThan5MB'),
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await apiService.uploadProfileImage(file);
      
      if (response.success && response.data) {
        const avatarUrl = response.data.avatar_url;
        const fullUrl = avatarUrl?.startsWith('http') ? avatarUrl : `${serverBaseUrl}${avatarUrl}`;
        const cacheBustedUrl = `${fullUrl}?t=${Date.now()}`;
        console.log('Setting new image URL:', cacheBustedUrl);
        setImageUrl(cacheBustedUrl);
        setImageError(false);
        toast({
          title: t('common.success'),
          description: t('profile.profileImageUpdatedSuccessfully')
        });
        onImageUpdated?.();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('profile.uploadFailed'),
        description: error instanceof Error ? error.message : t('profile.failedToUploadImage'),
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (isOpen === false) return null;

  return (
    <div className="relative">
      <div
        className={`
          w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${displayUsername}'s profile`}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', imageUrl);
              setImageError(false);
            }}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {displayUsername.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button */}
      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full"
        onClick={handleClick}
        disabled={isUploading}
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? t('profile.uploading') : t('profile.changePhoto')}
      </Button>
    </div>
  );
};
