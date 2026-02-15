import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PrayerName, CampaignConfig, DEFAULT_CAMPAIGN_CONFIG } from '@/lib/types';
import { useIndexedDB } from './useIndexedDB';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from '@/hooks/use-toast';

export interface CloudMember {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CloudAttendance {
  id: string;
  member_id: string;
  date: string;
  fajr: boolean;
  zuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

interface CachedConfig extends CampaignConfig {
  id: string;
}

export function useCloudCampaignData() {
  const { user } = useAuth();
  const [members, setMembers] = useState<CloudMember[]>([]);
  const [attendance, setAttendance] = useState<CloudAttendance[]>([]);
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Offline support hooks
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const { 
    isReady: dbReady, 
    getAll, 
    putMany, 
    put, 
    remove, 
    clear,
    addToSyncQueue,
    getSyncQueue,
    removeFromSyncQueue,
  } = useIndexedDB();

  const isSyncing = useRef(false);
  const hasLoadedFromCache = useRef(false);

  // Load from IndexedDB cache first
  useEffect(() => {
    if (dbReady && !hasLoadedFromCache.current) {
      loadFromCache();
      hasLoadedFromCache.current = true;
    }
  }, [dbReady]);

  const loadFromCache = async () => {
    try {
      console.log('Loading from IndexedDB cache...');
      
      const [cachedMembers, cachedAttendance, cachedConfig] = await Promise.all([
        getAll<CloudMember>('members'),
        getAll<CloudAttendance>('attendance'),
        getAll<CachedConfig>('config'),
      ]);

      if (cachedMembers.length > 0) {
        setMembers(cachedMembers);
        console.log(`Loaded ${cachedMembers.length} members from cache`);
      }

      if (cachedAttendance.length > 0) {
        setAttendance(cachedAttendance);
        console.log(`Loaded ${cachedAttendance.length} attendance records from cache`);
      }

      if (cachedConfig.length > 0) {
        const cfg = cachedConfig[0];
        setConfig({
          startDate: cfg.startDate,
          endDate: cfg.endDate,
          streakTarget: cfg.streakTarget,
        });
        setConfigId(cfg.id);
        console.log('Loaded config from cache');
      }

      // If we have cached data, mark loading as done
      if (cachedMembers.length > 0 || cachedAttendance.length > 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading from cache:', err);
    }
  };

  // Save to IndexedDB cache - uses putMany (upsert) to avoid race conditions
  // Previously used clear+putMany which could lose data if a refresh happened between clear and put
  const saveToCache = async (
    newMembers?: CloudMember[],
    newAttendance?: CloudAttendance[],
    newConfig?: CachedConfig
  ) => {
    if (!dbReady) return;

    try {
      if (newMembers) {
        // Use putMany to upsert all members, then remove any that no longer exist
        await putMany('members', newMembers);
        const cachedMembers = await getAll<CloudMember>('members');
        const newMemberIds = new Set(newMembers.map(m => m.id));
        for (const cached of cachedMembers) {
          if (!newMemberIds.has(cached.id)) {
            await remove('members', cached.id);
          }
        }
      }
      if (newAttendance) {
        await putMany('attendance', newAttendance);
        const cachedAttendance = await getAll<CloudAttendance>('attendance');
        const newAttIds = new Set(newAttendance.map(a => a.id));
        for (const cached of cachedAttendance) {
          if (!newAttIds.has(cached.id)) {
            await remove('attendance', cached.id);
          }
        }
      }
      if (newConfig) {
        await clear('config');
        await put('config', newConfig);
      }
    } catch (err) {
      console.error('Error saving to cache:', err);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    if (user && isOnline) {
      fetchAllData();
      setupRealtimeSubscription();
    }
  }, [user, isOnline]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && dbReady) {
      console.log('Back online - syncing pending changes...');
      syncPendingChanges().then(() => {
        resetWasOffline();
        fetchAllData(); // Refresh from cloud
      });
    }
  }, [isOnline, wasOffline, dbReady]);

  const syncPendingChanges = async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      console.log(`Syncing ${queue.length} pending changes...`);
      
      const sortedQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
      
      let successCount = 0;
      let failCount = 0;

      for (const item of sortedQueue) {
        try {
          const { store, action, data } = item;
          
          if (store === 'members') {
            if (action === 'add') {
              const memberInsert = data as { name: string; phone?: string | null; created_by?: string | null };
              await supabase.from('members').insert(memberInsert);
            } else if (action === 'update') {
              const memberData = data as { id: string; phone?: string | null; photo_url?: string | null };
              const { id, ...updateData } = memberData;
              await supabase.from('members').update(updateData).eq('id', id);
            } else if (action === 'delete') {
              await supabase.from('members').delete().eq('id', (data as { id: string }).id);
            }
          } else if (store === 'attendance') {
            if (action === 'add') {
              const attInsert = data as { 
                member_id: string; 
                date: string; 
                fajr?: boolean; 
                zuhr?: boolean; 
                asr?: boolean; 
                maghrib?: boolean; 
                isha?: boolean;
                updated_by?: string | null;
              };
              await supabase.from('attendance').insert(attInsert);
            } else if (action === 'update') {
              const attData = data as { id: string; [key: string]: unknown };
              const { id, ...updateData } = attData;
              await supabase.from('attendance').update(updateData).eq('id', id);
            }
          } else if (store === 'config') {
            if (action === 'update') {
              const cfgData = data as { id: string; [key: string]: unknown };
              const { id, ...updateData } = cfgData;
              await supabase.from('campaign_config').update(updateData).eq('id', id);
            }
          }

          await removeFromSyncQueue(item.id);
          successCount++;
        } catch (err) {
          console.error('Sync item failed:', err);
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
  };

  const fetchAllData = async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMembers(),
        fetchAttendance(),
        fetchConfig()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    setMembers(data || []);
    
    // Cache to IndexedDB
    if (data && dbReady) {
      saveToCache(data, undefined, undefined);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    setAttendance(data || []);
    
    // Cache to IndexedDB
    if (data && dbReady) {
      saveToCache(undefined, data, undefined);
    }
  };

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('campaign_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    if (data) {
      const cfg: CachedConfig = {
        id: data.id,
        startDate: data.start_date,
        endDate: data.end_date,
        streakTarget: data.streak_target,
      };
      setConfig({
        startDate: cfg.startDate,
        endDate: cfg.endDate,
        streakTarget: cfg.streakTarget,
      });
      setConfigId(data.id);
      
      // Cache to IndexedDB
      if (dbReady) {
        saveToCache(undefined, undefined, cfg);
      }
    }
  };

  const setupRealtimeSubscription = () => {
    const membersChannel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        if (isOnline) fetchMembers();
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        if (isOnline) fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(attendanceChannel);
    };
  };

  const addMember = async (name: string, phone?: string) => {
    const newMember: Omit<CloudMember, 'id' | 'created_at'> = {
      name,
      phone: phone || null,
      photo_url: null,
      created_by: user?.id || null,
    };

    if (isOnline) {
      const { data, error } = await supabase
        .from('members')
        .insert({
          name,
          phone: phone || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local cache
      if (data && dbReady) {
        await put('members', data);
      }
      
      return data;
    } else {
      // Offline: Create temporary member and queue for sync
      const tempMember: CloudMember = {
        id: `temp_${Date.now()}`,
        name,
        phone: phone || null,
        photo_url: null,
        created_at: new Date().toISOString(),
        created_by: user?.id || null,
      };

      // Save to IndexedDB
      if (dbReady) {
        await put('members', tempMember);
        await addToSyncQueue({
          store: 'members',
          action: 'add',
          data: { name, phone: phone || null, created_by: user?.id || null },
        });
      }

      // Update state
      setMembers(prev => [...prev, tempMember]);
      
      toast({
        title: 'Offline এ সংরক্ষিত',
        description: 'Online হলে Cloud এ sync হবে',
      });

      return tempMember;
    }
  };

  const updateMemberPhoto = async (memberId: string, photoUrl: string | null) => {
    // Build the updated member from current state synchronously
    const currentMember = members.find(m => m.id === memberId);
    if (!currentMember) {
      console.error('Member not found for photo update:', memberId);
      return;
    }
    
    const updatedMember: CloudMember = { ...currentMember, photo_url: photoUrl };

    // Update local state (optimistic update)
    setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));

    // Update IndexedDB cache immediately
    if (dbReady) {
      await put('members', updatedMember);
      console.log('Photo URL saved to IndexedDB:', updatedMember.photo_url);
    }

    if (isOnline) {
      const { data, error } = await supabase
        .from('members')
        .update({ photo_url: photoUrl })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Error updating photo in cloud:', error);
        // Rollback local state
        setMembers(prev => prev.map(m => m.id === memberId ? currentMember : m));
        if (dbReady) {
          await put('members', currentMember);
        }
        throw error;
      }
      
      // Update with confirmed cloud data
      if (data) {
        const confirmedMember: CloudMember = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          photo_url: data.photo_url,
          created_at: data.created_at,
          created_by: data.created_by,
        };
        setMembers(prev => prev.map(m => m.id === memberId ? confirmedMember : m));
        if (dbReady) {
          await put('members', confirmedMember);
        }
      }
      console.log('Photo URL confirmed in Cloud:', data?.photo_url);
    } else {
      // Queue for sync when offline
      if (dbReady) {
        await addToSyncQueue({
          store: 'members',
          action: 'update',
          data: { id: memberId, photo_url: photoUrl },
        });
      }

      toast({
        title: 'Offline এ সংরক্ষিত',
        description: 'Online হলে sync হবে',
      });
    }
  };

  const updateMemberPhone = async (memberId: string, phone: string | null) => {
    if (isOnline) {
      const { error } = await supabase
        .from('members')
        .update({ phone })
        .eq('id', memberId);

      if (error) throw error;
    } else {
      if (dbReady) {
        await addToSyncQueue({
          store: 'members',
          action: 'update',
          data: { id: memberId, phone },
        });
      }

      toast({
        title: 'Offline এ সংরক্ষিত',
        description: 'Online হলে sync হবে',
      });
    }

    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, phone } : m
    ));

    if (dbReady) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        await put('members', { ...member, phone });
      }
    }
  };

  const removeMember = async (memberId: string) => {
    if (isOnline) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } else {
      if (dbReady) {
        await addToSyncQueue({
          store: 'members',
          action: 'delete',
          data: { id: memberId },
        });
      }

      toast({
        title: 'Offline এ মুছে ফেলা হয়েছে',
        description: 'Online হলে Cloud থেকেও মুছে যাবে',
      });
    }

    // Update local state and cache
    setMembers(prev => prev.filter(m => m.id !== memberId));

    if (dbReady) {
      await remove('members', memberId);
    }
  };

  const getAttendanceForDate = useCallback((memberId: string, date: string): CloudAttendance | undefined => {
    return attendance.find(a => a.member_id === memberId && a.date === date);
  }, [attendance]);

  const togglePrayer = async (memberId: string, date: string, prayer: PrayerName) => {
    const existing = attendance.find(a => a.member_id === memberId && a.date === date);
    
    if (existing) {
      const updatedRecord = { ...existing, [prayer]: !existing[prayer] };

      // Optimistic update - always update local state first
      setAttendance(prev => prev.map(a => 
        a.id === existing.id ? updatedRecord : a
      ));

      // Save to IndexedDB cache
      if (dbReady) {
        await put('attendance', updatedRecord);
      }

      if (isOnline) {
        const { error } = await supabase
          .from('attendance')
          .update({
            [prayer]: !existing[prayer],
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('id', existing.id);

        if (error) {
          // Rollback optimistic update
          setAttendance(prev => prev.map(a => 
            a.id === existing.id ? existing : a
          ));
          if (dbReady) {
            await put('attendance', existing);
          }
          throw error;
        }
      } else {
        // Offline: queue for sync
        if (dbReady) {
          await addToSyncQueue({
            store: 'attendance',
            action: 'update',
            data: {
              id: existing.id,
              [prayer]: !existing[prayer],
              updated_at: new Date().toISOString(),
              updated_by: user?.id,
            },
          });
        }

        toast({
          title: 'Offline এ সংরক্ষিত ✓',
          description: 'Online হলে Cloud এ sync হবে',
        });
      }
    } else {
      // Create new record
      const newRecord: CloudAttendance = {
        id: `temp_${Date.now()}`,
        member_id: memberId,
        date,
        fajr: prayer === 'fajr',
        zuhr: prayer === 'zuhr',
        asr: prayer === 'asr',
        maghrib: prayer === 'maghrib',
        isha: prayer === 'isha',
      };

      // Optimistic update - always add to local state first
      setAttendance(prev => [...prev, newRecord]);

      if (dbReady) {
        await put('attendance', newRecord);
      }

      if (isOnline) {
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            member_id: memberId,
            date,
            fajr: prayer === 'fajr',
            zuhr: prayer === 'zuhr',
            asr: prayer === 'asr',
            maghrib: prayer === 'maghrib',
            isha: prayer === 'isha',
            updated_by: user?.id
          })
          .select()
          .single();

        if (error) {
          // Rollback
          setAttendance(prev => prev.filter(a => a.id !== newRecord.id));
          if (dbReady) {
            await remove('attendance', newRecord.id);
          }
          throw error;
        }
        
        if (data) {
          // Replace temp record with real one
          setAttendance(prev => prev.map(a => a.id === newRecord.id ? data : a));
          if (dbReady) {
            await remove('attendance', newRecord.id);
            await put('attendance', data);
          }
        }
      } else {
        // Offline: queue for sync
        if (dbReady) {
          await addToSyncQueue({
            store: 'attendance',
            action: 'add',
            data: {
              member_id: memberId,
              date,
              fajr: prayer === 'fajr',
              zuhr: prayer === 'zuhr',
              asr: prayer === 'asr',
              maghrib: prayer === 'maghrib',
              isha: prayer === 'isha',
              updated_by: user?.id,
            },
          });
        }

        toast({
          title: 'Offline এ সংরক্ষিত ✓',
          description: 'Online হলে Cloud এ sync হবে',
        });
      }
    }
  };

  const deleteAttendanceByDate = async (date: string) => {
    if (isOnline) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('date', date);

      if (error) throw error;
    }

    setAttendance(prev => prev.filter(a => a.date !== date));
  };

  const getMemberStats = useCallback((memberId: string) => {
    const memberAttendance = attendance.filter(a => a.member_id === memberId);
    
    let totalPoints = 0;
    let activeDays = 0;
    let qualifyingDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    
    const sortedAttendance = [...memberAttendance].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const qualifyingDayDates: string[] = [];
    
    sortedAttendance.forEach(record => {
      const prayers = [record.fajr, record.zuhr, record.asr, record.maghrib, record.isha];
      const dayPoints = prayers.filter(Boolean).length;
      totalPoints += dayPoints;
      
      if (dayPoints >= 1) {
        activeDays++;
      }
      
      if (record.fajr && record.isha) {
        qualifyingDays++;
        qualifyingDayDates.push(record.date);
      }
    });
    
    let tempStreak = 0;
    for (let i = 0; i < qualifyingDayDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(qualifyingDayDates[i - 1]);
        const currDate = new Date(qualifyingDayDates[i]);
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (qualifyingDayDates.length > 0) {
      const lastQualifyingDate = new Date(qualifyingDayDates[qualifyingDayDates.length - 1]);
      lastQualifyingDate.setHours(0, 0, 0, 0);
      
      if (lastQualifyingDate.getTime() === today.getTime() || 
          lastQualifyingDate.getTime() === yesterday.getTime()) {
        currentStreak = tempStreak;
      }
    }
    
    return {
      totalPoints,
      activeDays,
      qualifyingDays,
      currentStreak,
      maxStreak,
      isWinner: maxStreak >= config.streakTarget,
    };
  }, [attendance, config.streakTarget]);

  const getLeaderboard = useMemo(() => {
    return members
      .map(member => ({
        ...member,
        stats: getMemberStats(member.id),
      }))
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
  }, [members, getMemberStats]);

  const updateConfig = async (newConfig: Partial<CampaignConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    if (isOnline) {
      const { data: existing } = await supabase
        .from('campaign_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('campaign_config')
          .update({
            start_date: updatedConfig.startDate,
            end_date: updatedConfig.endDate,
            streak_target: updatedConfig.streakTarget,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('id', existing.id);

        if (error) throw error;
      }
    } else if (configId && dbReady) {
      await addToSyncQueue({
        store: 'config',
        action: 'update',
        data: {
          id: configId,
          start_date: updatedConfig.startDate,
          end_date: updatedConfig.endDate,
          streak_target: updatedConfig.streakTarget,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        },
      });

      toast({
        title: 'Offline এ সংরক্ষিত',
        description: 'Online হলে sync হবে',
      });
    }

    // Cache to IndexedDB
    if (dbReady && configId) {
      await put('config', { id: configId, ...updatedConfig });
    }
  };

  // Convert cloud attendance to legacy format for compatibility
  const attendanceForLegacy = useMemo(() => {
    return attendance.map(a => ({
      memberId: a.member_id,
      date: a.date,
      prayers: {
        fajr: a.fajr,
        zuhr: a.zuhr,
        asr: a.asr,
        maghrib: a.maghrib,
        isha: a.isha,
      }
    }));
  }, [attendance]);

  // Convert cloud members to legacy format
  const membersForLegacy = useMemo(() => {
    return members.map(m => ({
      id: m.id,
      name: m.name,
      phone: m.phone || undefined,
      photo: m.photo_url || undefined,
      createdAt: m.created_at,
    }));
  }, [members]);

  return {
    members: membersForLegacy,
    cloudMembers: members,
    attendance: attendanceForLegacy,
    cloudAttendance: attendance,
    loading,
    error,
    isOnline,
    addMember,
    updateMemberPhoto,
    updateMemberPhone,
    removeMember,
    deleteAttendanceByDate,
    getAttendanceForDate: (memberId: string, date: string) => {
      const record = attendance.find(a => a.member_id === memberId && a.date === date);
      if (!record) return undefined;
      return {
        memberId: record.member_id,
        date: record.date,
        prayers: {
          fajr: record.fajr,
          zuhr: record.zuhr,
          asr: record.asr,
          maghrib: record.maghrib,
          isha: record.isha,
        }
      };
    },
    togglePrayer,
    getMemberStats,
    getLeaderboard: getLeaderboard.map(m => ({
      ...m,
      id: m.id,
      name: m.name,
      phone: m.phone || undefined,
      photo: m.photo_url || undefined,
      createdAt: m.created_at,
    })),
    config,
    updateConfig,
    refetch: fetchAllData,
  };
}
