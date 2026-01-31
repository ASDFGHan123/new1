import { useEffect, useRef, useCallback } from 'react';
import { apiService } from '@/lib/api';

/**
 * Sends a heartbeat every 10 seconds to keep the user marked as online.
 * Also tracks page visibility to pause/resume on tab changes.
 */
export function useHeartbeat(isAuthenticated: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const lastHeartbeatRef = useRef<number>(Date.now());

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !isVisibleRef.current) return;
    try {
      await apiService.httpRequest('/users/heartbeat/', {
        method: 'POST',
      });
      lastHeartbeatRef.current = Date.now();
    } catch (err) {
      console.warn('Heartbeat failed:', err);
    }
  }, [isAuthenticated]);

  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;
    if (isVisibleRef.current && isAuthenticated) {
      // When tab becomes visible, send a heartbeat immediately
      sendHeartbeat();
    }
  }, [isAuthenticated, sendHeartbeat]);

  const handleActivity = useCallback(() => {
    // Reset timer on user activity (mouse, keyboard, touch)
    lastHeartbeatRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 10 seconds
    intervalRef.current = setInterval(sendHeartbeat, 10000);

    // Visibility events
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, sendHeartbeat, handleVisibilityChange, handleActivity]);
}
