import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  codename: string;
  name: string;
  description: string;
}

interface ModeratorPermissionsManagerProps {
  userId: string;
  username: string;
  currentPermissions: string[];
  onClose: () => void;
  onUpdate: () => void;
}

export function ModeratorPermissionsManager({
  userId,
  username,
  currentPermissions,
  onClose,
  onUpdate,
}: ModeratorPermissionsManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<string[]>(currentPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await apiService.httpRequest<Permission[]>('/admin/permissions/available/');
        if (resp.success && resp.data) {
          setPermissions(resp.data);
        }
      } catch (err) {
        toast({ title: 'Failed to load permissions', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await apiService.httpRequest(`/admin/permissions/set/${userId}/`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: selected }),
      });
      if (resp.success) {
        toast({ title: 'Permissions updated' });
        onUpdate();
        onClose();
      } else {
        throw new Error(resp.error || 'Failed to update');
      }
    } catch (err) {
      toast({ title: 'Failed to update permissions', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (codename: string) => {
    setSelected(prev =>
      prev.includes(codename)
        ? prev.filter(p => p !== codename)
        : [...prev, codename]
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage Permissions – {username}</CardTitle>
            <CardDescription>Choose what this moderator can access and do.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {permissions.map(p => (
              <div key={p.codename} className="flex items-start space-x-3">
                <Checkbox
                  id={p.codename}
                  checked={selected.includes(p.codename)}
                  onCheckedChange={() => togglePermission(p.codename)}
                />
                <div className="flex-1">
                  <label htmlFor={p.codename} className="font-medium cursor-pointer">
                    {p.name}
                  </label>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
