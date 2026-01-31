import React from "react";
import { Download, Trash2, FileText, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface DataExportOptions {
  messages: boolean;
  profile: boolean;
  activity: boolean;
  connections: boolean;
}

interface DataToolsProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onExportData: (userId: string, options: DataExportOptions) => void;
  onDeleteData: (userId: string, options: DataExportOptions) => void;
}

export const DataTools = ({ userId, username, isOpen, onClose, onExportData, onDeleteData }: DataToolsProps) => {
  const [exportOptions, setExportOptions] = React.useState<DataExportOptions>({
    messages: true,
    profile: true,
    activity: false,
    connections: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleExport = () => {
    onExportData(userId, exportOptions);
    onClose();
  };

  const handleDelete = () => {
    onDeleteData(userId, exportOptions);
    setShowDeleteConfirm(false);
    onClose();
  };

  const updateOption = (key: keyof DataExportOptions, value: boolean) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Data Management: {username}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Select Data Types</h4>
              <div className="space-y-3">
                {[
                  { key: 'profile', label: 'Profile Information', icon: FileText },
                  { key: 'messages', label: 'Messages & Conversations', icon: Database },
                  { key: 'activity', label: 'Activity Logs', icon: FileText },
                  { key: 'connections', label: 'Connections & Friends', icon: Database }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={exportOptions[key as keyof DataExportOptions]}
                      onCheckedChange={(checked) => updateOption(key as keyof DataExportOptions, !!checked)}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col space-y-2">
            <div className="flex space-x-2 w-full">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Data Deletion</DialogTitle>
          </DialogHeader>
          <p>This will permanently delete the selected data for {username}. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};