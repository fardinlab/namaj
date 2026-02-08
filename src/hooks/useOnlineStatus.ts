import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    console.log('Network: Online');
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    console.log('Network: Offline');
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Reset wasOffline flag
  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return { 
    isOnline, 
    wasOffline, 
    resetWasOffline 
  };
}
