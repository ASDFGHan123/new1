/**
 * Connection Status Indicator Component
 * Shows real-time WebSocket connection status with visual indicators
 */

import React from 'react';
import { useConnectionStatus } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  variant?: 'inline' | 'floating' | 'header';
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  variant = 'inline',
  showDetails = true,
  className
}) => {
  const { 
    connectionState, 
    isConnected, 
    isConnecting, 
    isDisconnected, 
    isReconnecting, 
    hasError,
    statusText,
    statusColor
  } = useConnectionStatus();
  
  const { success, error } = useToast();
  
  // Show status change notifications
  React.useEffect(() => {
    switch (connectionState) {
      case 'connected':
        success('Connected', 'Real-time connection established');
        break;
      case 'error':
        error('Connection Error', 'Failed to establish real-time connection');
        break;
    }
  }, [connectionState, success, error]);
  
  const getIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'connecting':
      case 'reconnecting':
        return <RotateCcw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };
  
  const getStatusVariant = () => {
    switch (connectionState) {
      case 'connected':
        return 'default';
      case 'connecting':
      case 'reconnecting':
        return 'secondary';
      case 'disconnected':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getBorderColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'connecting':
      case 'reconnecting':
        return 'border-yellow-200 bg-yellow-50';
      case 'disconnected':
        return 'border-gray-200 bg-gray-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  if (variant === 'header') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full border",
          getBorderColor()
        )}>
          {getIcon()}
          {showDetails && (
            <span className={cn("text-xs font-medium", statusColor)}>
              {statusText}
            </span>
          )}
        </div>
        {isReconnecting && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Reconnecting...
          </Badge>
        )}
      </div>
    );
  }
  
  if (variant === 'floating') {
    return (
      <div className={cn(
        "fixed bottom-4 right-4 z-50 p-3 rounded-lg border shadow-lg",
        "bg-white min-w-[200px]",
        getBorderColor(),
        className
      )}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <div className="flex-1">
            <p className={cn("text-sm font-medium", statusColor)}>
              {statusText}
            </p>
            {showDetails && isReconnecting && (
              <p className="text-xs text-muted-foreground">
                Attempting to reconnect...
              </p>
            )}
          </div>
          {(isDisconnected || hasError) && (
            <Button 
              size="sm" 
              variant="outline"
              className="h-6 px-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Default inline variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg border",
        getBorderColor()
      )}>
        <div className={cn("flex items-center gap-1", statusColor)}>
          {getIcon()}
          {showDetails && (
            <span className="text-sm font-medium">{statusText}</span>
          )}
        </div>
        {(isConnecting || isReconnecting) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <span>Connecting...</span>
          </div>
        )}
        {hasError && (
          <Button 
            size="sm" 
            variant="outline"
            className="h-6 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

// Simplified connection status dot for use in headers
export const ConnectionStatusDot: React.FC<{ className?: string }> = ({ className }) => {
  const { connectionState, isConnected } = useConnectionStatus();
  
  const getDotColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        getDotColor(),
        (isConnected || connectionState === 'connecting' || connectionState === 'reconnecting') && "animate-pulse",
        className
      )} />
      {isConnected && (
        <span className="text-xs text-muted-foreground">Online</span>
      )}
    </div>
  );
};

// Connection status with details for debug/info panels
export const ConnectionStatusDetails: React.FC<{ className?: string }> = ({ className }) => {
  const { 
    connectionState, 
    isConnected, 
    isConnecting, 
    isDisconnected, 
    isReconnecting, 
    hasError,
    statusText,
    statusColor
  } = useConnectionStatus();
  
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-muted-foreground">Connection Status</h3>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>State:</span>
          <span className={cn("font-medium", statusColor)}>{statusText}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Connected:</span>
          <span>{isConnected ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Connecting:</span>
          <span>{isConnecting ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Reconnecting:</span>
          <span>{isReconnecting ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Disconnected:</span>
          <span>{isDisconnected ? 'Yes' : 'No'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Has Error:</span>
          <span>{hasError ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {connectionState === 'reconnecting' && (
          <p>Auto-reconnection is active</p>
        )}
        {connectionState === 'error' && (
          <p>Connection failed. Check your network settings.</p>
        )}
        {connectionState === 'connected' && (
          <p>Real-time features are available</p>
        )}
      </div>
    </div>
  );
};

// Hook for connection status monitoring
export const useConnectionMonitoring = () => {
  const { connectionState } = useConnectionStatus();
  
  const getConnectionHealth = () => {
    switch (connectionState) {
      case 'connected':
        return {
          status: 'healthy',
          message: 'All real-time features are working',
          color: 'green'
        };
      case 'connecting':
      case 'reconnecting':
        return {
          status: 'warning',
          message: 'Reconnecting to server...',
          color: 'yellow'
        };
      case 'disconnected':
        return {
          status: 'error',
          message: 'No real-time connection',
          color: 'gray'
        };
      case 'error':
        return {
          status: 'critical',
          message: 'Connection error occurred',
          color: 'red'
        };
      default:
        return {
          status: 'unknown',
          message: 'Connection status unknown',
          color: 'gray'
        };
    }
  };
  
  const isRealtimeAvailable = connectionState === 'connected';
  
  return {
    connectionState,
    health: getConnectionHealth(),
    isRealtimeAvailable
  };
};