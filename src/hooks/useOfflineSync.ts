import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexedDB, SyncQueueItem } from './useIndexedDB';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const { 
    isReady: dbReady, 
    getSyncQueue, 
    removeFromSyncQueue,
    clearSyncQueue 
  } = useIndexedDB();
  
  const isSyncing = useRef(false);

  // Process a single sync queue item
  const processSyncItem = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const { store, action, data } = item;
      
      console.log(`Syncing: ${action} on ${store}`, data);

      switch (store) {
        case 'members': {
          if (action === 'add') {
            const memberInsert = data as { name: string; phone?: string; created_by?: string };
            const { error } = await supabase.from('members').insert(memberInsert);
            if (error) throw error;
          } else if (action === 'update') {
            const memberData = data as { id: string; name?: string; phone?: string; photo_url?: string };
            const { id, ...updateData } = memberData;
            const { error } = await supabase
              .from('members')
              .update(updateData)
              .eq('id', id);
            if (error) throw error;
          } else if (action === 'delete') {
            const { error } = await supabase
              .from('members')
              .delete()
              .eq('id', (data as { id: string }).id);
            if (error) throw error;
          }
          break;
        }

        case 'attendance': {
          if (action === 'add') {
            const attendanceInsert = data as { 
              member_id: string; 
              date: string; 
              fajr?: boolean; 
              zuhr?: boolean; 
              asr?: boolean; 
              maghrib?: boolean; 
              isha?: boolean;
              updated_by?: string;
            };
            const { error } = await supabase.from('attendance').insert(attendanceInsert);
            if (error) throw error;
          } else if (action === 'update') {
            const attendanceData = data as { id: string; [key: string]: unknown };
            const { id, ...updateData } = attendanceData;
            const { error } = await supabase
              .from('attendance')
              .update(updateData)
              .eq('id', id);
            if (error) throw error;
          } else if (action === 'delete') {
            const { error } = await supabase
              .from('attendance')
              .delete()
              .eq('id', (data as { id: string }).id);
            if (error) throw error;
          }
          break;
        }

        case 'config': {
          if (action === 'update') {
            const configData = data as { id: string; [key: string]: unknown };
            const { error } = await supabase
              .from('campaign_config')
              .update(configData)
              .eq('id', configData.id);
            if (error) throw error;
          }
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Sync item failed:', error);
      return false;
    }
  }, []);

  // Sync all pending items
  const syncPendingChanges = useCallback(async () => {
    if (!dbReady || isSyncing.current || !isOnline) return;

    isSyncing.current = true;

    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      console.log(`Syncing ${queue.length} pending changes...`);
      
      // Sort by timestamp to maintain order
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
      
      let successCount = 0;
      let failCount = 0;

      for (const item of sortedQueue) {
        const success = await processSyncItem(item);
        
        if (success) {
          await removeFromSyncQueue(item.id);
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'ডাটা sync হয়েছে ✓',
          description: `${successCount}টি পরিবর্তন Cloud এ সংরক্ষিত হয়েছে`,
        });
      }

      if (failCount > 0) {
        toast({
          title: 'কিছু sync হয়নি',
          description: `${failCount}টি পরিবর্তন sync করতে সমস্যা হয়েছে`,
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [dbReady, isOnline, getSyncQueue, removeFromSyncQueue, processSyncItem]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && dbReady) {
      console.log('Back online - syncing pending changes...');
      syncPendingChanges().then(() => {
        resetWasOffline();
      });
    }
  }, [isOnline, wasOffline, dbReady, syncPendingChanges, resetWasOffline]);

  return {
    isOnline,
    isSyncing: isSyncing.current,
    syncPendingChanges,
    clearSyncQueue,
  };
}
