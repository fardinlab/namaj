import { useCallback, useEffect, useRef, useState } from 'react';

const DB_NAME = 'prayer-tracker-offline';
const DB_VERSION = 1;

export interface DBStores {
  members: 'members';
  attendance: 'attendance';
  config: 'config';
  syncQueue: 'syncQueue';
}

export interface SyncQueueItem {
  id: string;
  store: keyof Omit<DBStores, 'syncQueue'>;
  action: 'add' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
}

export function useIndexedDB() {
  const dbRef = useRef<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize database
  useEffect(() => {
    const initDB = () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        setError('IndexedDB খুলতে সমস্যা হয়েছে');
      };

      request.onsuccess = () => {
        dbRef.current = request.result;
        setIsReady(true);
        console.log('IndexedDB ready');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Members store
        if (!db.objectStoreNames.contains('members')) {
          db.createObjectStore('members', { keyPath: 'id' });
        }

        // Attendance store with compound index
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('member_date', ['member_id', 'date'], { unique: true });
          attendanceStore.createIndex('date', 'date', { unique: false });
        }

        // Config store
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }

        // Sync queue for offline operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('IndexedDB stores created');
      };
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Get all items from a store
  const getAll = useCallback(<T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Get single item by key
  const get = useCallback(<T>(storeName: string, key: string): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Put item (add or update)
  const put = useCallback(<T extends { id: string }>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Put multiple items
  const putMany = useCallback(<T extends { id: string }>(storeName: string, items: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = items.length;

      if (total === 0) {
        resolve();
        return;
      }

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }, []);

  // Delete item
  const remove = useCallback((storeName: string, key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Clear entire store
  const clear = useCallback((storeName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!dbRef.current) {
        reject(new Error('Database not ready'));
        return;
      }

      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, []);

  // Add to sync queue
  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> => {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    return put('syncQueue', queueItem);
  }, [put]);

  // Get all sync queue items
  const getSyncQueue = useCallback((): Promise<SyncQueueItem[]> => {
    return getAll<SyncQueueItem>('syncQueue');
  }, [getAll]);

  // Clear sync queue
  const clearSyncQueue = useCallback((): Promise<void> => {
    return clear('syncQueue');
  }, [clear]);

  // Remove from sync queue
  const removeFromSyncQueue = useCallback((id: string): Promise<void> => {
    return remove('syncQueue', id);
  }, [remove]);

  return {
    isReady,
    error,
    getAll,
    get,
    put,
    putMany,
    remove,
    clear,
    addToSyncQueue,
    getSyncQueue,
    clearSyncQueue,
    removeFromSyncQueue,
  };
}
