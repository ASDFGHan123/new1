import { useEffect, useRef } from 'react';

export const useOnlineStatusTracking = (token: string | null) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/heartbeat/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.log('Heartbeat sent');
      }
    };

    // Send heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    intervalRef.current = setInterval(sendHeartbeat, 30000);

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - will go offline after 2 minutes
      } else {
        // Page visible - send heartbeat immediately
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);
};
