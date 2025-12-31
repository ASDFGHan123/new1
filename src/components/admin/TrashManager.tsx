import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, RotateCcw, Trash, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface TrashItem {
  id: string;
  item_type: string;
  item_id: number;
  item_data: any;
  deleted_by: string;
  deleted_at: string;
  expires_at: string;
}

export const TrashManager = React.forwardRef<{ refresh: () => Promise<void> }>((_props, ref) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.httpRequest<TrashItem[]>('/users/trash/');
      
      if (response.success && response.data) {
        setTrashItems(Array.isArray(response.data) ? response.data : response.data.results || []);
      } else {
        setError(response.error || t('errors.failedToLoad'));
        setTrashItems([]);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRestore = async (item: TrashItem) => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    
    try {
      const response = await apiService.httpRequest('/users/trash/restore/', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, item_type: item.item_type })
      });
      
      if (response.success) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        toast({
          title: t('trash.restoreItem'),
          description: t('trash.restoreItem')
        });
      } else {
        throw new Error(response.error || 'Failed to restore item');
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('errors.failedToUpdate'),
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    
    try {
      const response = await apiService.httpRequest(`/users/trash/${item.id}/`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        toast({
          title: t('trash.deletePermanently'),
          description: t('trash.deletePermanently')
        });
      } else {
        throw new Error(response.error || 'Failed to delete item');
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('errors.failedToDelete'),
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleEmptyTrash = async () => {
    setLoading(true);
    
    try {
      const response = await apiService.httpRequest('/users/trash/empty_trash/', {
        method: 'POST'
      });
      
      if (response.success) {
        setTrashItems([]);
        toast({
          title: t('trash.emptyTrash'),
          description: t('trash.emptyTrash')
        });
      } else {
        throw new Error(response.error || 'Failed to empty trash');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to empty trash',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
    
    // Auto-refresh every 5 seconds
    refreshIntervalRef.current = setInterval(loadTrash, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadTrash]);

  // Expose refresh method via ref
  React.useImperativeHandle(ref, () => ({
    refresh: loadTrash
  }));

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{t('admin.trash')}</CardTitle>
            <CardDescription>
              {t('trash.deletedItems')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadTrash}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
            {trashItems.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="w-4 h-4 mr-2" />
                    {t('trash.emptyTrash')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('trash.emptyTrash')}</DialogTitle>
                    <DialogDescription>
                      {t('trash.emptyTrashWarning')}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" asChild>
                      <DialogClose>{t('common.cancel')}</DialogClose>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleEmptyTrash}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {t('trash.emptyTrash')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">{t('trash.loadingTrash')}</p>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="text-center py-8">
            <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">{t('trash.noDeletedItems')}</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('trash.itemType')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('trash.deletedBy')}</TableHead>
                  <TableHead>{t('trash.deletedAt')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trashItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {t(`trash.item_types.${item.item_type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.item_type === 'user' ? item.item_data.username : `ID: ${item.item_id}`}
                    </TableCell>
                    <TableCell>
                      {item.deleted_by || t('common.system')}
                    </TableCell>
                    <TableCell>
                      {new Date(item.deleted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getDaysUntilExpiry(item.expires_at) <= 7 ? 'destructive' : 'secondary'}
                      >
                        {getDaysUntilExpiry(item.expires_at)} {t('common.days')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(item)}
                          disabled={actionLoading[item.id]}
                        >
                          {actionLoading[item.id] ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3 mr-1" />
                          )}
                          {t('trash.restore')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePermanentDelete(item)}
                          disabled={actionLoading[item.id]}
                        >
                          {actionLoading[item.id] ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Trash className="w-3 h-3 mr-1" />
                          )}
                          {t('common.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TrashManager.displayName = 'TrashManager';
