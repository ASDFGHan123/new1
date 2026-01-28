import { Trash2, RotateCcw, X, Search, Filter, Eye, MoreHorizontal, AlertTriangle, Printer, FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiService } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface TrashItem {
  id: string;
  item_type: string;
  item_id: string;
  item_data: any;
  source_tab: string;
  source_tab_display: string;
  deleted_by: string;
  delete_reason: string;
  deleted_at: string;
  is_restorable?: boolean;
  restore_unavailable_reason?: string;
}

interface TrashSectionedProps {
  onRestore?: (item: TrashItem) => void;
  onPermanentDelete?: (item: TrashItem) => void;
}

const SOURCE_TAB_ICONS = {
  'Users': <FolderOpen className="h-4 w-4" />,
  'Chat': <FolderOpen className="h-4 w-4" />,
  'Departments': <FolderOpen className="h-4 w-4" />,
  'Message Templates': <FolderOpen className="h-4 w-4" />,
  'Roles & Permissions': <FolderOpen className="h-4 w-4" />,
  'Settings': <FolderOpen className="h-4 w-4" />,
  'Audit Logs': <FolderOpen className="h-4 w-4" />,
  'Backup': <FolderOpen className="h-4 w-4" />,
  'Analytics': <FolderOpen className="h-4 w-4" />,
};

const ITEM_TYPE_COLORS = {
  'USER': 'bg-blue-100 text-blue-800',
  'CONVERSATION': 'bg-green-100 text-green-800',
  'MESSAGE': 'bg-purple-100 text-purple-800',
  'GROUP': 'bg-orange-100 text-orange-800',
  'DEPARTMENT': 'bg-cyan-100 text-cyan-800',
  'OFFICE': 'bg-indigo-100 text-indigo-800',
  'MESSAGE_TEMPLATE': 'bg-pink-100 text-pink-800',
  'ROLE': 'bg-yellow-100 text-yellow-800',
  'FILE': 'bg-gray-100 text-gray-800',
};

export const TrashSectioned: React.FC<TrashSectionedProps> = ({
  onRestore,
  onPermanentDelete,
}) => {
  const { t } = useTranslation();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchTrashItems();
  }, []);

  useEffect(() => {
    // Show loading indicator after 2 seconds
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoadingIndicator(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchTrashItems = async () => {
    try {
      setLoading(true);
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const responsePromise = apiService.httpRequest('/admin/trash/?page_size=100');
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      // Handle paginated response
      const responseData = response?.data || response;
      const items = responseData?.results || responseData || [];
      
      // Ensure we always have an array
      setTrashItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching trash items:", error);
      // Set empty array on error to prevent reduce errors
      setTrashItems([]);
      toast({
        title: t('trash.error'),
        description: error instanceof Error && error.message === 'Request timeout' 
          ? t('trash.timeoutError') 
          : t('trash.fetchError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowLoadingIndicator(false);
    }
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      const response = await apiService.httpRequest(`/admin/trash/${item.id}/restore/`, {
        method: 'POST'
      });
      
      if (response.success || response.message) {
        toast({
          title: t('trash.restoreSuccess'),
          description: response.message || t('trash.itemRestored'),
        });
        
        onRestore?.(item);
        fetchTrashItems();
      } else {
        throw new Error(response.error || 'Restore failed');
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({
        title: t('trash.restoreError'),
        description: error instanceof Error ? error.message : t('trash.restoreFailed'),
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    try {
      const response = await apiService.httpRequest(`/admin/trash/${item.id}/`, {
        method: 'DELETE'
      });
      
      if (response.success || response.message) {
        toast({
          title: t('trash.deleteSuccess'),
          description: response.message || t('trash.itemDeleted'),
        });
        
        onPermanentDelete?.(item);
        fetchTrashItems();
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: t('trash.deleteError'),
        description: error instanceof Error ? error.message : t('trash.deleteFailed'),
        variant: "destructive",
      });
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const response = await apiService.httpRequest('/admin/trash/empty/', {
        method: 'POST'
      });
      
      if (response.success || response.message) {
        toast({
          title: t('trash.emptySuccess'),
          description: response.message || t('trash.trashEmptied'),
        });
        
        fetchTrashItems();
      } else {
        throw new Error(response.error || 'Empty trash failed');
      }
    } catch (error) {
      console.error("Error emptying trash:", error);
      toast({
        title: t('trash.emptyError'),
        description: error instanceof Error ? error.message : t('trash.emptyFailed'),
        variant: "destructive",
      });
    }
  };

  // Group items by source tab - ensure trashItems is always an array
  const groupedItems = (Array.isArray(trashItems) ? trashItems : []).reduce((acc, item) => {
    const source = item.source_tab_display || 'Other';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(item);
    return acc;
  }, {} as Record<string, TrashItem[]>);

  // Filter items based on search
  const filterItems = (items: TrashItem[]) => {
    if (!Array.isArray(items)) return [];
    
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return items;
    
    return items.filter(item => {
      const toText = (value: unknown) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const haystack = [
        item.item_type,
        item.item_id,
        item.source_tab_display,
        item.deleted_by,
        item.delete_reason,
        item.item_data?.username,
        item.item_data?.name,
        item.item_data?.title,
        item.item_data?.department_name,
      ]
        .map(toText)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchLower);
    });
  };

  const renderTrashTable = (items: TrashItem[]) => {
    const filteredItems = filterItems(items);
    
    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>{t('trash.noDeletedItems')}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('trash.itemType')}</TableHead>
            <TableHead>{t('trash.itemName')}</TableHead>
            <TableHead>{t('trash.deletedBy')}</TableHead>
            <TableHead>{t('trash.deletedAt')}</TableHead>
            <TableHead>{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Badge className={ITEM_TYPE_COLORS[item.item_type as keyof typeof ITEM_TYPE_COLORS]}>
                  {item.item_type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {item.item_data?.username || 
                     item.item_data?.name || 
                     item.item_data?.title || 
                     `${item.item_type} ${item.item_id}`}
                  </div>
                  {item.delete_reason && (
                    <div className="text-sm text-muted-foreground">
                      {item.delete_reason}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{item.deleted_by}</TableCell>
              <TableCell>
                {new Date(item.deleted_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleRestore(item)}
                      disabled={item.is_restorable === false}
                      className={item.is_restorable === false ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('trash.restore')}
                      {item.is_restorable === false && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({item.restore_unavailable_reason || t('trash.cannotRestore')})
                        </span>
                      )}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('trash.permanentlyDelete')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('trash.deleteWarning')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('trash.deleteWarning')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(item)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('trash.permanentlyDelete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (loading && !showLoadingIndicator) {
    return null; // Don't show anything for the first 2 seconds
  }

  if (showLoadingIndicator) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('trash.loadingTrash')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('trash.deletedItems')}</h2>
          <p className="text-muted-foreground">
            {t('trash.deletedItemsDescription')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('trash.searchItems')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('trash.emptyTrash')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('trash.emptyTrashWarning')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('trash.emptyTrashWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmptyTrash}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('trash.emptyTrash')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            {t('trash.all')} ({Array.isArray(trashItems) ? trashItems.length : 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            {t('trash.users')} ({(groupedItems['Users']?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="departments">
            {t('trash.departments')} ({(groupedItems['Departments']?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="chat">
            {t('trash.chat')} ({(groupedItems['Chat']?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="templates">
            {t('trash.templates')} ({(groupedItems['Message Templates']?.length || 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                {t('trash.allItems')}
              </CardTitle>
              <CardDescription>
                {t('trash.allItemsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTrashTable(trashItems)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {SOURCE_TAB_ICONS['Users']}
                {t('trash.fromUsers')}
              </CardTitle>
              <CardDescription>
                {t('trash.usersDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTrashTable(groupedItems['Users'] || [])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {SOURCE_TAB_ICONS['Departments']}
                {t('trash.fromDepartments')}
              </CardTitle>
              <CardDescription>
                {t('trash.departmentsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTrashTable(groupedItems['Departments'] || [])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {SOURCE_TAB_ICONS['Chat']}
                {t('trash.fromChat')}
              </CardTitle>
              <CardDescription>
                {t('trash.chatDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTrashTable(groupedItems['Chat'] || [])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {SOURCE_TAB_ICONS['Message Templates']}
                {t('trash.fromTemplates')}
              </CardTitle>
              <CardDescription>
                {t('trash.templatesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTrashTable(groupedItems['Message Templates'] || [])}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
