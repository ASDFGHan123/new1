import { Search, Filter, Clock, User, Activity, ChevronUp, ChevronDown, Eye, Download, MoreHorizontal, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { apiService } from "@/lib/api";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'warning':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getSeverityBg = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'dark:bg-red-950/30 bg-red-50';
    case 'warning':
      return 'dark:bg-yellow-950/30 bg-yellow-50';
    default:
      return 'dark:bg-blue-950/30 bg-blue-50';
  }
};

export const AuditLogs = () => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getAuditLogs();
      if (!resp.success) throw new Error(resp.error || 'Failed to fetch');

      const data = resp.data || [];
      setAuditLogs(Array.isArray(data) ? data : (data as any).results || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
  });

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{t('audit.auditLogs')}</CardTitle>
            <CardDescription>
              {t('audit.auditLogsDescription')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
            {t('common.refresh')}
          </Button>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('common.search')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto scroll-smooth" style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.timestamp')}</TableHead>
                <TableHead>{t('audit.action')}</TableHead>
                <TableHead>{t('audit.user')}</TableHead>
                <TableHead>{t('audit.details')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('audit.noLogs')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} className={getSeverityBg(log.severity || 'info')}>
                    <TableCell>
                      <span className="text-sm font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`audit.actions.${log.action_type}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{log.actor || t('common.system')}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(log.severity || 'info')}>
                        {t(log.severity || 'common.info').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
        <style>{`
          div::-webkit-scrollbar {
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          div::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          @media (prefers-color-scheme: dark) {
            div::-webkit-scrollbar-track {
              background: #1e293b;
            }
            div::-webkit-scrollbar-thumb {
              background: #475569;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #64748b;
            }
          }
        `}</style>
      </CardContent>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('audit.logDetails')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t('audit.timestamp')}</Label>
                <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('audit.action')}</Label>
                <p className="text-sm">{selectedLog.action_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('audit.user')}</Label>
                <p className="text-sm">{selectedLog.actor || t('common.system')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t('audit.details')}</Label>
                <p className="text-sm">{selectedLog.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
