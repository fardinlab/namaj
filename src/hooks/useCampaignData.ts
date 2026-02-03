import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Member, AttendanceRecord, CampaignConfig, DEFAULT_CAMPAIGN_CONFIG, PrayerName } from '@/lib/types';

// One-time cleanup on module load: Remove attendance before Feb 4, 2026
const CAMPAIGN_START_DATE = '2026-02-04';
const storedAttendance = localStorage.getItem('campaign-attendance');
if (storedAttendance) {
  try {
    const parsed = JSON.parse(storedAttendance) as AttendanceRecord[];
    const filtered = parsed.filter(a => a.date >= CAMPAIGN_START_DATE);
    if (filtered.length !== parsed.length) {
      localStorage.setItem('campaign-attendance', JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore parsing errors
  }
}

export function useCampaignData() {
  const [members, setMembers] = useLocalStorage<Member[]>('campaign-members', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('campaign-attendance', []);
  const [config, setConfig] = useLocalStorage<CampaignConfig>('campaign-config', DEFAULT_CAMPAIGN_CONFIG);

  const addMember = (name: string, phone?: string) => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      phone,
      createdAt: new Date().toISOString(),
    };
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateMemberPhoto = (memberId: string, photo: string | undefined) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, photo } : m
    ));
  };

  const updateMemberPhone = (memberId: string, phone: string | undefined) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, phone } : m
    ));
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setAttendance(prev => prev.filter(a => a.memberId !== memberId));
  };

  const deleteAttendanceByDate = (date: string) => {
    setAttendance(prev => prev.filter(a => a.date !== date));
  };

  const getAttendanceForDate = (memberId: string, date: string): AttendanceRecord | undefined => {
    return attendance.find(a => a.memberId === memberId && a.date === date);
  };

  const togglePrayer = (memberId: string, date: string, prayer: PrayerName) => {
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.memberId === memberId && a.date === date);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          prayers: {
            ...updated[existingIndex].prayers,
            [prayer]: !updated[existingIndex].prayers[prayer],
          },
        };
        return updated;
      } else {
        return [...prev, {
          memberId,
          date,
          prayers: {
            fajr: prayer === 'fajr',
            zuhr: prayer === 'zuhr',
            asr: prayer === 'asr',
            maghrib: prayer === 'maghrib',
            isha: prayer === 'isha',
          },
        }];
      }
    });
  };

  const getMemberStats = (memberId: string) => {
    const memberAttendance = attendance.filter(a => a.memberId === memberId);
    
    let totalPoints = 0;
    let activeDays = 0; // Days with at least 1 prayer
    let qualifyingDays = 0; // Days with Fajr AND Isha prayers
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Sort attendance by date
    const sortedAttendance = [...memberAttendance].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const qualifyingDayDates: string[] = [];
    
    sortedAttendance.forEach(record => {
      const prayers = Object.values(record.prayers);
      const dayPoints = prayers.filter(Boolean).length;
      totalPoints += dayPoints;
      
      // Count days with at least 1 prayer
      if (dayPoints >= 1) {
        activeDays++;
      }
      
      // Count qualifying days (Fajr AND Isha prayers)
      if (record.prayers.fajr && record.prayers.isha) {
        qualifyingDays++;
        qualifyingDayDates.push(record.date);
      }
    });
    
    // Calculate streak for qualifying days (Fajr + Isha)
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
    
    // Check if current streak is ongoing (includes today or yesterday)
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
      activeDays, // Days with at least 1 prayer
      qualifyingDays, // Days with Fajr AND Isha
      currentStreak,
      maxStreak,
      isWinner: maxStreak >= config.streakTarget,
    };
  };

  const getLeaderboard = useMemo(() => {
    return members
      .map(member => ({
        ...member,
        stats: getMemberStats(member.id),
      }))
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
  }, [members, attendance]);

  const updateConfig = (newConfig: Partial<CampaignConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return {
    members,
    attendance,
    addMember,
    updateMemberPhoto,
    updateMemberPhone,
    removeMember,
    deleteAttendanceByDate,
    getAttendanceForDate,
    togglePrayer,
    getMemberStats,
    getLeaderboard,
    config,
    updateConfig,
  };
}
