import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Setting {
  key: string;
  value: string;
  category: string;
  description: string;
}

export function SettingsManager() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>({});
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/settings/');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const grouped = data.reduce((acc: any, s: Setting) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
      }, {});
      setSettings(grouped);
    } catch (error) {
      console.error('Settings error:', error);
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
      const token = localStorage.getItem('access_token');
      await fetch('http://localhost:8000/api/admin/settings/bulk/update/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ settings: Object.entries(changes).map(([k, v]) => ({ key: k, value: v })) }),
      });
      toast({ title: 'Success', description: 'Settings saved' });
      setChanges({});
      fetchSettings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  const categories = Object.keys(settings).sort();

  if (categories.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">No settings available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settings</h2>
        <Button onClick={saveSettings} disabled={Object.keys(changes).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(cat => <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>)}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="space-y-3">
            {settings[cat]?.map(s => (
              <Card key={s.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{s.key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                </CardHeader>
                <CardContent>
                  {s.key.includes('enabled') || s.key.includes('require') ? (
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
