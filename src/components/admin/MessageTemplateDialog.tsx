import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  template,
  mode,
}: MessageTemplateDialogProps) => {
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
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), content: content.trim(), category });
      toast({
        title: "Success",
        description: `Template ${mode === "add" ? "created" : "updated"} successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${mode} template. Please try again.`,
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
            {mode === "add" ? "Add Message Template" : "Edit Message Template"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new reusable message template."
              : "Modify the selected message template."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="Enter template name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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
            <Label htmlFor="template-content">Message Content *</Label>
            <Textarea
              id="template-content"
              placeholder="Enter the message content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length} characters
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong> Use placeholders like {"{username}"} or {"{app_name}"} in your templates.
              They will be replaced when the template is used.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !content.trim()}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                {mode === "add" ? "Create Template" : "Update Template"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};