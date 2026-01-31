import { useEffect } from 'react';

export const useAutoRefreshUsers = (onRefresh: () => void, interval: number = 10000) => {
  useEffect(() => {
    // Refresh immediately
    onRefresh();

    // Refresh every interval (default 10 seconds)
    const refreshInterval = setInterval(onRefresh, interval);

    return () => clearInterval(refreshInterval);
  }, [onRefresh, interval]);
};
