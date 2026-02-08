import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PrayerName, CampaignConfig, DEFAULT_CAMPAIGN_CONFIG } from '@/lib/types';

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

export function useCloudCampaignData() {
  const { user } = useAuth();
  const [members, setMembers] = useState<CloudMember[]>([]);
  const [attendance, setAttendance] = useState<CloudAttendance[]>([]);
  const [config, setConfig] = useState<CampaignConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    if (user) {
      fetchAllData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchAllData = async () => {
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
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    setAttendance(data || []);
  };

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('campaign_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    if (data) {
      setConfig({
        startDate: data.start_date,
        endDate: data.end_date,
        streakTarget: data.streak_target
      });
    }
  };

  const setupRealtimeSubscription = () => {
    const membersChannel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchMembers();
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(attendanceChannel);
    };
  };

  const addMember = async (name: string, phone?: string) => {
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
    return data;
  };

  const updateMemberPhoto = async (memberId: string, photoUrl: string | null) => {
    const { error } = await supabase
      .from('members')
      .update({ photo_url: photoUrl })
      .eq('id', memberId);

    if (error) throw error;
  };

  const updateMemberPhone = async (memberId: string, phone: string | null) => {
    const { error } = await supabase
      .from('members')
      .update({ phone })
      .eq('id', memberId);

    if (error) throw error;
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  };

  const getAttendanceForDate = useCallback((memberId: string, date: string): CloudAttendance | undefined => {
    return attendance.find(a => a.member_id === memberId && a.date === date);
  }, [attendance]);

  const togglePrayer = async (memberId: string, date: string, prayer: PrayerName) => {
    const existing = attendance.find(a => a.member_id === memberId && a.date === date);
    
    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('attendance')
        .update({
          [prayer]: !existing[prayer],
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', existing.id);

      if (error) throw error;
      
      // Optimistic update
      setAttendance(prev => prev.map(a => 
        a.id === existing.id 
          ? { ...a, [prayer]: !a[prayer] }
          : a
      ));
    } else {
      // Create new record
      const newRecord = {
        member_id: memberId,
        date,
        fajr: prayer === 'fajr',
        zuhr: prayer === 'zuhr',
        asr: prayer === 'asr',
        maghrib: prayer === 'maghrib',
        isha: prayer === 'isha',
        updated_by: user?.id
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert(newRecord)
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic update
      if (data) {
        setAttendance(prev => [...prev, data]);
      }
    }
  };

  const deleteAttendanceByDate = async (date: string) => {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('date', date);

    if (error) throw error;
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
    const { data: existing } = await supabase
      .from('campaign_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('campaign_config')
        .update({
          start_date: newConfig.startDate ?? config.startDate,
          end_date: newConfig.endDate ?? config.endDate,
          streak_target: newConfig.streakTarget ?? config.streakTarget,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', existing.id);

      if (error) throw error;
    }

    setConfig(prev => ({ ...prev, ...newConfig }));
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
