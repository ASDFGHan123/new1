import { Search, Filter, Clock, User, Activity, ChevronUp, ChevronDown, Eye, Download, MoreHorizontal } from "lucide-react";
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

const initialAuditLogs = [
  {
    id: 1,
    action: "USER_LOGIN",
    actor: "john_doe",
    targetType: "USER",
    targetId: 123,
    timestamp: "2024-01-22 14:30:25",
    ipAddress: "192.168.1.1",
    description: "User successfully logged in",
    severity: "info",
  },
  {
    id: 2,
    action: "MESSAGE_DELETE",
    actor: "admin_user",
    targetType: "MESSAGE",
    targetId: 456,
    timestamp: "2024-01-22 14:25:10",
    ipAddress: "192.168.1.100",
    description: "Message deleted by admin",
    severity: "warning",
  },
  {
    id: 3,
    action: "USER_ROLE_CHANGE",
    actor: "admin_user",
    targetType: "USER",
    targetId: 789,
    timestamp: "2024-01-22 14:20:45",
    ipAddress: "192.168.1.100",
    description: "User role changed from USER to ADMIN",
    severity: "high",
  },
  {
    id: 4,
    action: "GROUP_CREATE",
    actor: "alice_smith",
    targetType: "GROUP",
    targetId: 101,
    timestamp: "2024-01-22 14:15:30",
    ipAddress: "192.168.1.50",
    description: "New group 'Development Team' created",
    severity: "info",
  },
  {
    id: 5,
    action: "USER_DEACTIVATE",
    actor: "admin_user",
    targetType: "USER",
    targetId: 999,
    timestamp: "2024-01-22 14:10:15",
    ipAddress: "192.168.1.100",
    description: "User account deactivated",
    severity: "high",
  },
];

const actions = ["USER_LOGIN", "MESSAGE_SEND", "USER_LOGOUT", "GROUP_JOIN", "MESSAGE_DELETE"];
const actors = ["john_doe", "alice_smith", "admin_user", "bob_wilson"];
const severities = ["info", "warning", "high"];

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
      return 'bg-admin-error/10';
    case 'warning':
      return 'bg-admin-warning/10';
    default:
      return 'bg-admin-primary/10';
  }
};

export const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | string>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | string>("all");
  const [sortBy, setSortBy] = useState<"timestamp" | "action" | "actor" | "severity">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<typeof initialAuditLogs[0] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        action: actions[Math.floor(Math.random() * actions.length)],
        actor: actors[Math.floor(Math.random() * actors.length)],
        targetType: "USER",
        targetId: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        description: "System action performed",
        severity: severities[Math.floor(Math.random() * severities.length)],
      };
      setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep up to 50 logs
    }, 8000); // Add new log every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter and sort logs
  const filteredAndSortedLogs = auditLogs
    .filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.ipAddress.includes(searchTerm);
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
      return matchesSearch && matchesAction && matchesSeverity;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "timestamp":
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case "action":
          aValue = a.action.toLowerCase();
          bValue = b.action.toLowerCase();
          break;
        case "actor":
          aValue = a.actor.toLowerCase();
          bValue = b.actor.toLowerCase();
          break;
        case "severity":
          const severityOrder = { high: 3, warning: 2, info: 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0;
          bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);
  const paginatedLogs = filteredAndSortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const handleViewDetails = (log: typeof initialAuditLogs[0]) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredAndSortedLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-logs-export-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Audit Logs</CardTitle>
            <CardDescription>
              Track all system actions and changes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search audit logs..."
              className="pl-10 bg-input border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={(value: any) => setActionFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{action.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value: any) => setSeverityFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setActionFilter("all");
                setSeverityFilter("all");
                setSortBy("timestamp");
                setSortOrder("desc");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("timestamp")}
              >
                <div className="flex items-center space-x-1">
                  <span>Timestamp</span>
                  {sortBy === "timestamp" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("action")}
              >
                <div className="flex items-center space-x-1">
                  <span>Action</span>
                  {sortBy === "action" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("actor")}
              >
                <div className="flex items-center space-x-1">
                  <span>Actor</span>
                  {sortBy === "actor" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("severity")}
              >
                <div className="flex items-center space-x-1">
                  <span>Severity</span>
                  {sortBy === "severity" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id} className={`hover:bg-muted/50 ${getSeverityBg(log.severity)}`}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{log.timestamp}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{log.actor}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {log.targetType}:{log.targetId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.description}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {log.ipAddress}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(log)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)} of {filteredAndSortedLogs.length} audit logs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Audit Log Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Activity className="w-6 h-6" />
              <span>Audit Log Details</span>
              <Badge variant={getSeverityColor(selectedLog?.severity || 'info')}>
                {selectedLog?.severity.toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Log ID</Label>
                  <p className="text-sm font-mono text-muted-foreground">{selectedLog.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm font-mono">{selectedLog.timestamp}</p>
                </div>
              </div>

              {/* Action Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action</Label>
                  <Badge variant="outline" className="font-mono">{selectedLog.action}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Actor</Label>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedLog.actor}</span>
                  </div>
                </div>
              </div>

              {/* Target Information */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target</Label>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="secondary">{selectedLog.targetType}</Badge>
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm font-mono">{selectedLog.targetId}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">{selectedLog.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Network Information */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Network Information</Label>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">IP Address:</span>
                      <span className="text-sm font-mono">{selectedLog.ipAddress}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};