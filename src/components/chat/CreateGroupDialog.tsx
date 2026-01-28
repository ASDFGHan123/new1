import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  Users, 
  X, 
  Plus, 
  Search, 
  UserPlus,
  Lock,
  Globe,
  Check
} from "lucide-react";
import { User, CreateGroupData } from "@/types/group";

interface CreateGroupDialogProps {
  currentUser: User;
  availableUsers: User[];
  onCreateGroup: (groupData: CreateGroupData) => void;
  trigger?: React.ReactNode;
}

export const CreateGroupDialog = ({
  currentUser,
  availableUsers,
  onCreateGroup,
  trigger
}: CreateGroupDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Members
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<string>();
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setGroupName("");
      setGroupDescription("");
      setGroupAvatar(undefined);
      setIsPrivate(false);
      setSelectedMembers([]);
      setSearchTerm("");
    }
  }, [open]);

  // Auto-include current user
  useEffect(() => {
    if (!selectedMembers.includes(currentUser.id)) {
      setSelectedMembers(prev => [...prev, currentUser.id]);
    }
  }, [currentUser.id, selectedMembers]);

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedMembers.includes(user.id)
  );

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(id => id !== userId));
  };

  const canProceed = () => {
    if (step === 1) {
      return groupName.trim().length >= 2;
    }
    if (step === 2) {
      return selectedMembers.length >= 2; // At least 3 people total (current user + 2 others)
    }
    return false;
  };

  const handleNext = () => {
    if (step === 1 && canProceed()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleCreateGroup = async () => {
    if (!canProceed()) return;

    setLoading(true);
    try {
      const groupData: CreateGroupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        avatar: groupAvatar,
        isPrivate,
        memberIds: selectedMembers
      };

      await onCreateGroup(groupData);
      setOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string) => {
    return availableUsers.find(u => u.id === userId) || currentUser;
  };

  const selectedUserObjects = selectedMembers.map(getUserById).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            <Plus className="h-4 w-4 mr-2" />
            {t('chat.createGroup')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('chat.createGroup')}
          </DialogTitle>
          <DialogDescription>{t('chat.createGroup')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">{t('chat.groupInfo')}</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">{t('chat.addMembers')}</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t('chat.groupInfo')}</h3>
                <p className="text-sm text-muted-foreground">{t('chat.groupDescription')}</p>
              </div>

              {/* Group Avatar */}
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={groupAvatar} />
                  <AvatarFallback showDefaultIcon={false} className="bg-primary text-primary-foreground text-lg">
                    {groupName.slice(0, 2).toUpperCase() || "GR"}
                  </AvatarFallback>
                </Avatar>
                <ImageUpload value={groupAvatar} onChange={setGroupAvatar} />
              </div>

              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="groupName">{t('chat.groupName')} *</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('chat.groupName')}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {groupName.length}/50 {t('common.characters')}
                </p>
              </div>

              {/* Group Description */}
              <div className="space-y-2">
                <Label htmlFor="groupDescription">{t('chat.groupDescription')}</Label>
                <Textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder={t('chat.groupDescription')}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {groupDescription.length}/200 {t('common.characters')}
                </p>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <Label>{t('chat.groupPrivacy')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      !isPrivate
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setIsPrivate(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('chat.public')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('chat.public')}
                        </p>
                      </div>
                      {!isPrivate && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      isPrivate
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => setIsPrivate(true)}
                  >
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('chat.private')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('chat.private')}
                        </p>
                      </div>
                      {isPrivate && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t('chat.addMembers')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('chat.addMembers')}
                </p>
              </div>

              {/* Selected Members */}
              <div className="space-y-2">
                <Label>{t('chat.members')} ({selectedMembers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUserObjects.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                      {user.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeMember(user.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Search Users */}
              <div className="space-y-2">
                <Label>{t('system.searchUsers')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('system.searchUsers')}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Available Users */}
              <div className="space-y-2">
                <Label>{t('users.userList')}</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/20">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('users.noUsersFound')}</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleMember(user.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {user.status}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between flex-shrink-0 pt-4 border-t">
            <div>
              {step === 2 && (
                <Button variant="outline" onClick={handleBack}>
                  {t('common.back')}
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('common.cancel')}
              </Button>
              {step === 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  {t('common.next')}
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateGroup} 
                  disabled={!canProceed() || loading}
                >
                  {loading ? t('common.loading') : t('chat.createGroup')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};