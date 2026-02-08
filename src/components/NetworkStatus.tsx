import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function NetworkStatus() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-destructive-foreground shadow-lg animate-in slide-in-from-left-5">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Offline - ডাটা locally সংরক্ষিত হচ্ছে</span>
    </div>
  );
}
