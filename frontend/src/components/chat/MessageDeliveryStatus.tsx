/**
 * Message Delivery Status Component
 * Shows real-time delivery status for sent messages with visual indicators
 */

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  X,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageDeliveryStatusProps {
  messageId: string;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'stacked';
}

interface DeliveryStatus {
  status: 'pending' | 'delivered' | 'failed';
  error?: string;
  timestamp?: Date;
}

export const MessageDeliveryStatus: React.FC<MessageDeliveryStatusProps> = ({
  messageId,
  className,
  showLabels = false,
  size = 'sm',
  variant = 'inline'
}) => {
  const { messageDeliveryStatus, onDelivery } = useWebSocket();
  const [status, setStatus] = React.useState<DeliveryStatus | null>(null);

  // Listen for delivery updates
  React.useEffect(() => {
    const unsubscribe = onDelivery((data) => {
      if (data.message_id === messageId) {
        setStatus({
          status: data.type === 'message_delivered' ? 'delivered' : 'failed',
          error: data.error,
          timestamp: new Date()
        });
      }
    });

    // Check initial status
    const initialStatus = messageDeliveryStatus.get(messageId);
    if (initialStatus) {
      setStatus({
        status: initialStatus.status,
        error: initialStatus.error,
        timestamp: new Date()
      });
    }

    return unsubscribe;
  }, [messageId, onDelivery, messageDeliveryStatus]);

  const getIcon = () => {
    switch (status?.status) {
      case 'delivered':
        return <CheckCheck className="text-green-500" />;
      case 'failed':
        return <X className="text-red-500" />;
      case 'pending':
      default:
        return <Clock className="text-gray-400" />;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'lg':
        return 'h-5 w-5';
      case 'md':
        return 'h-4 w-4';
      case 'sm':
      default:
        return 'h-3 w-3';
    }
  };

  const getLabel = () => {
    if (!showLabels) return null;

    switch (status?.status) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  if (variant === 'stacked') {
    return (
      <div className={cn("flex flex-col items-end gap-1", className)}>
        <div className={cn("flex items-center gap-1", getSize())}>
          {getIcon()}
        </div>
        {showLabels && (
          <span className={cn(
            "text-xs font-medium",
            status?.status === 'delivered' ? 'text-green-600' :
            status?.status === 'failed' ? 'text-red-600' :
            'text-gray-500'
          )}>
            {getLabel()}
          </span>
        )}
        {status?.status === 'failed' && status.error && (
          <div className="text-xs text-red-600 max-w-32 truncate" title={status.error}>
            {status.error}
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={getSize()}>
        {getIcon()}
      </div>
      {showLabels && (
        <span className={cn(
          "text-xs font-medium",
          status?.status === 'delivered' ? 'text-green-600' :
          status?.status === 'failed' ? 'text-red-600' :
          'text-gray-500'
        )}>
          {getLabel()}
        </span>
      )}
      {status?.status === 'failed' && status.error && (
        <div className="text-xs text-red-600 max-w-32 truncate" title={status.error}>
          {status.error}
        </div>
      )}
    </div>
  );
};

// Message delivery status bar for conversation lists
export const ConversationDeliveryStatus: React.FC<{
  lastMessageId?: string;
  className?: string;
}> = ({ lastMessageId, className }) => {
  const { messageDeliveryStatus, onDelivery } = useWebSocket();
  const [status, setStatus] = React.useState<'all-delivered' | 'some-pending' | 'has-failed'>('all-delivered');

  React.useEffect(() => {
    if (!lastMessageId) return;

    const unsubscribe = onDelivery((data) => {
      // Update status based on delivery confirmation
      if (data.message_id === lastMessageId) {
        if (data.type === 'message_delivered') {
          setStatus('all-delivered');
        } else if (data.type === 'message_failed') {
          setStatus('has-failed');
        }
      }
    });

    // Check initial status
    const initialStatus = messageDeliveryStatus.get(lastMessageId);
    if (initialStatus?.status === 'failed') {
      setStatus('has-failed');
    } else if (initialStatus?.status === 'pending') {
      setStatus('some-pending');
    }

    return unsubscribe;
  }, [lastMessageId, onDelivery, messageDeliveryStatus]);

  const getStatusIcon = () => {
    switch (status) {
      case 'all-delivered':
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case 'some-pending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'has-failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
  };

  if (!lastMessageId) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {getStatusIcon()}
    </div>
  );
};

// Hook for message delivery tracking
export const useMessageDelivery = (messageId?: string) => {
  const { messageDeliveryStatus, onDelivery } = useWebSocket();
  const [status, setStatus] = React.useState<DeliveryStatus | null>(null);

  React.useEffect(() => {
    if (!messageId) return;

    const unsubscribe = onDelivery((data) => {
      if (data.message_id === messageId) {
        setStatus({
          status: data.type === 'message_delivered' ? 'delivered' : 'failed',
          error: data.error,
          timestamp: new Date()
        });
      }
    });

    // Check initial status
    const initialStatus = messageDeliveryStatus.get(messageId);
    if (initialStatus) {
      setStatus({
        status: initialStatus.status,
        error: initialStatus.error,
        timestamp: new Date()
      });
    }

    return unsubscribe;
  }, [messageId, onDelivery, messageDeliveryStatus]);

  const isDelivered = status?.status === 'delivered';
  const hasFailed = status?.status === 'failed';
  const isPending = !status || status.status === 'pending';

  return {
    status,
    isDelivered,
    hasFailed,
    isPending
  };
};

export default MessageDeliveryStatus;