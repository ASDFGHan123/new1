import { useEffect, useRef } from 'react';

export const usePresenceTracking = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/presence/?token=${token}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Presence tracking connected');
        // Send ping every 30 seconds
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'user_status_change') {
            window.dispatchEvent(new CustomEvent('userStatusChange', { detail: data }));
          }
        } catch (e) {
          console.error('Failed to parse presence message:', e);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Presence tracking error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('Presence tracking disconnected');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    } catch (error) {
      console.error('Failed to connect to presence tracking:', error);
    }

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {};
};
