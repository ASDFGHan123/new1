import React, { useState, useEffect, useCallback } from "react";
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

export const TrashManager = () => {
  const { toast } = useToast();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  const getApiUrl = () => {
    const hostname = window.location.hostname;
    const port = '8000';
    return `http://${hostname}:${port}/api`;
  };

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      apiService.initializeAuth();
      const token = apiService.getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/users/trash/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        setTrashItems([]);
      } else if (response.status === 500) {
        setError('Trash feature not initialized. Run: python manage.py migrate users 0004_trash');
        setTrashItems([]);
      } else if (response.ok) {
        const data = await response.json();
        setTrashItems(Array.isArray(data) ? data : data.results || []);
      } else {
        throw new Error('Failed to load trash');
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
      apiService.initializeAuth();
      const token = apiService.getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: 'Not authenticated',
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/users/trash/restore/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ item_id: item.id, item_type: item.item_type })
      });
      
      if (response.ok) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        toast({
          title: "Item Restored",
          description: `${item.item_type} has been restored successfully.`
        });
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        throw new Error('Failed to restore item');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to restore item',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    
    try {
      apiService.initializeAuth();
      const token = apiService.getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: 'Not authenticated',
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/users/trash/${item.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setTrashItems(prev => prev.filter(t => t.id !== item.id));
        toast({
          title: "Item Deleted",
          description: `${item.item_type} has been permanently deleted.`
        });
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete item',
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleEmptyTrash = async () => {
    setLoading(true);
    
    try {
      apiService.initializeAuth();
      const token = apiService.getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: 'Not authenticated',
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${getApiUrl()}/users/trash/empty_trash/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setTrashItems([]);
        toast({
          title: "Trash Emptied",
          description: "All expired items have been permanently deleted."
        });
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        throw new Error('Failed to empty trash');
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
  }, [loadTrash]);

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
            <CardTitle className="text-xl">Trash</CardTitle>
            <CardDescription>
              Manage deleted items. Items expire after 30 days.
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
              Refresh
            </Button>
            {trashItems.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="w-4 h-4 mr-2" />
                    Empty Trash
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Empty Trash</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all expired items. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" asChild>
                      <DialogClose>Cancel</DialogClose>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleEmptyTrash}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Empty Trash
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
            <p className="text-muted-foreground">Loading trash...</p>
          </div>
        ) : trashItems.length === 0 ? (
          <div className="text-center py-8">
            <Trash2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">Trash is empty</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Deleted By</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trashItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.item_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.item_type === 'user' ? item.item_data.username : `ID: ${item.item_id}`}
                    </TableCell>
                    <TableCell>
                      {item.deleted_by || 'System'}
                    </TableCell>
                    <TableCell>
                      {new Date(item.deleted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getDaysUntilExpiry(item.expires_at) <= 7 ? 'destructive' : 'secondary'}
                      >
                        {getDaysUntilExpiry(item.expires_at)} days
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
                          Restore
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
                          Delete
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
};
