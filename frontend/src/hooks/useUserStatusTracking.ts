import { useEffect, useRef, useState } from 'react';
import { apiService } from '@/lib/api';

interface UserStatusUpdate {
  user_id: string;
  status: 'online' | 'away' | 'offline';
  timestamp: string;
}

export function useUserStatusTracking(onStatusChange?: (update: UserStatusUpdate) => void) {
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const [isTracking, setIsTracking] = useState(false);
  const lastStatusRef = useRef<Map<string, string>>(new Map());
  const callbackRef = useRef(onStatusChange);

  useEffect(() => {
    callbackRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    setIsTracking(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await apiService.getUsers();
        
        if (response.success && response.data) {
          response.data.forEach((user: any) => {
            const newStatus = user.online_status || 'offline';
            const lastStatus = lastStatusRef.current.get(user.id);
            
            if (lastStatus !== newStatus) {
              lastStatusRef.current.set(user.id, newStatus);
              callbackRef.current?.({
                user_id: user.id,
                status: newStatus,
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      } catch (error) {
        console.error('[UserStatus] Polling error:', error);
      }
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        setIsTracking(false);
      }
    };
  }, []);

  return {
    isConnected: isTracking,
    setUserAway: () => {},
    setUserOnline: () => {},
  };
}
