import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface MessageTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<MessageTemplate, "id">) => void;
  onTrash?: (templateId: string) => void;
  template?: MessageTemplate | null;
  mode: "add" | "edit";
}

const templateCategories = [
  "Welcome",
  "Maintenance",
  "Security",
  "Announcement",
  "Support",
  "Custom"
];

export const MessageTemplateDialog = ({
  isOpen,
  onClose,
  onSave,
  onTrash,
  template,
  mode,
}: MessageTemplateDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Custom");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (template && mode === "edit") {
      setName(template.name);
      setContent(template.content);
      setCategory(template.category);
    } else {
      setName("");
      setContent("");
      setCategory("Custom");
    }
  }, [template, mode, isOpen]);

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast({
        title: t('common.error'),
        description: t('common.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), content: content.trim(), category });
      toast({
        title: t('common.success'),
        description: mode === "add" ? t('messages.templateCreated') : t('messages.templateUpdated'),
      });
      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('messages.templateFailed'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setContent("");
    setCategory("Custom");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? t('messages.addTemplate') : t('messages.editTemplate')}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? t('messages.createTemplate')
              : t('messages.modifyTemplate')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">{t('messages.templateName')} *</Label>
            <Input
              id="template-name"
              placeholder={t('messages.templateName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">{t('settings.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-content">{t('messages.messageContent')} *</Label>
            <Textarea
              id="template-content"
              placeholder={t('messages.messageContent')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length} {t('common.characters')}
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{t('messages.tips')}:</strong> {t('messages.templateTips')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !name.trim() || !content.trim()}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  {mode === "add" ? t('messages.createTemplate') : t('messages.updateTemplate')}
                </>
              )}
            </Button>
            {mode === "edit" && template && onTrash && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSaving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('trash.deletedItems')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('trash.deletedItems')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('trash.moveToTrashConfirm', { name: template.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onTrash(template.id);
                        onClose();
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t('trash.deletedItems')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};