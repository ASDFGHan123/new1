import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface Setting {
  key: string;
  value: string;
  category: string;
  description: string;
}

export function SettingsManager() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiService.httpRequest('/admin/settings/');
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        const grouped = data.reduce((acc: any, s: Setting) => {
          if (!acc[s.category]) acc[s.category] = [];
          acc[s.category].push(s);
          return acc;
        }, {});
        setSettings(grouped);
      }
    } catch (error) {
      console.error(t('settings.settingsError'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    if (Object.keys(changes).length === 0) return;
    try {
      const response = await apiService.httpRequest('/admin/settings/bulk/update/', {
        method: 'POST',
        body: JSON.stringify({ settings: Object.entries(changes).map(([k, v]) => ({ key: k, value: v })) }),
      });
      
      if (response.success) {
        toast({ title: t('common.success'), description: t('settings.settingsSaved') });
        setChanges({});
        fetchSettings();
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: changes }));
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: t('common.error'), description: t('settings.failedToSave'), variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const categories = Object.keys(settings).sort();

  if (categories.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">{t('settings.noSettings')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin.settings')}</h2>
        <Button onClick={saveSettings} disabled={Object.keys(changes).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          {t('common.save')}
        </Button>
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 5)}, minmax(0, 1fr))` }}>
          {categories.map(cat => <TabsTrigger key={cat} value={cat} className="capitalize">{t(`settings.categories.${cat.toLowerCase().replace(/\s/g, '_')}`)}</TabsTrigger>)}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-3">
            {settings[cat]?.map(s => (
              <Card key={s.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{s.key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent>
                  {s.key === 'backup_frequency' ? (
                    <Select value={changes[s.key] ?? s.value} onValueChange={(v) => handleChange(s.key, v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">{t('settings.hourly')}</SelectItem>
                        <SelectItem value="daily">{t('settings.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('settings.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('settings.monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : s.key.includes('enabled') || s.key.includes('require') ? (
                    <Switch
                      checked={(changes[s.key] ?? s.value) === 'true'}
                      onCheckedChange={(v) => handleChange(s.key, v ? 'true' : 'false')}
                    />
                  ) : (
                    <Input
                      value={changes[s.key] ?? s.value}
                      onChange={(e) => handleChange(s.key, e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
