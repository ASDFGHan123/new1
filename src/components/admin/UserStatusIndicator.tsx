import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserStatusTracking } from '@/hooks/useUserStatusTracking';

interface UserStatusIndicatorProps {
  userId: string;
  username: string;
  initialStatus?: 'online' | 'away' | 'offline';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserStatusIndicator({
  userId,
  username,
  initialStatus = 'offline',
  showLabel = true,
  size = 'md',
}: UserStatusIndicatorProps) {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>(initialStatus);
  const { isConnected } = useUserStatusTracking((update) => {
    if (update.user_id === userId) {
      setStatus(update.status);
    }
  });

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  const statusLabels = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full`} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{statusLabels[status]}</span>
      )}
    </div>
  );
}

interface UserStatusBadgeProps {
  userId: string;
  initialStatus?: 'online' | 'away' | 'offline';
}

export function UserStatusBadge({ userId, initialStatus = 'offline' }: UserStatusBadgeProps) {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>(initialStatus);
  const { isConnected } = useUserStatusTracking((update) => {
    if (update.user_id === userId) {
      setStatus(update.status);
    }
  });

  const variantMap = {
    online: 'default',
    away: 'secondary',
    offline: 'outline',
  } as const;

  const labelMap = {
    online: 'Online',
    away: 'Away',
    offline: 'Offline',
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

interface UserStatusListProps {
  users: Array<{
    id: string;
    username: string;
    online_status: 'online' | 'away' | 'offline';
  }>;
}

export function UserStatusList({ users }: UserStatusListProps) {
  const [userStatuses, setUserStatuses] = useState<
    Record<string, 'online' | 'away' | 'offline'>
  >(
    users.reduce(
      (acc, user) => {
        acc[user.id] = user.online_status;
        return acc;
      },
      {} as Record<string, 'online' | 'away' | 'offline'>
    )
  );

  const { isConnected } = useUserStatusTracking((update) => {
    setUserStatuses((prev) => ({
      ...prev,
      [update.user_id]: update.status,
    }));
  });

  const onlineUsers = users.filter((u) => userStatuses[u.id] === 'online');
  const awayUsers = users.filter((u) => userStatuses[u.id] === 'away');
  const offlineUsers = users.filter((u) => userStatuses[u.id] === 'offline');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">
          Online ({onlineUsers.length})
        </h3>
        <div className="space-y-1">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">
          Away ({awayUsers.length})
        </h3>
        <div className="space-y-1">
          {awayUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">
          Offline ({offlineUsers.length})
        </h3>
        <div className="space-y-1">
          {offlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {isConnected ? '🟢 Live tracking active' : '🔴 Connecting...'}
      </div>
    </div>
  );
}
