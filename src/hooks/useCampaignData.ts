import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Member, AttendanceRecord, CAMPAIGN_CONFIG, PrayerName } from '@/lib/types';

export function useCampaignData() {
  const [members, setMembers] = useLocalStorage<Member[]>('campaign-members', []);
  const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('campaign-attendance', []);

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

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setAttendance(prev => prev.filter(a => a.memberId !== memberId));
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
    let perfectDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Sort attendance by date
    const sortedAttendance = [...memberAttendance].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const perfectDayDates: string[] = [];
    
    sortedAttendance.forEach(record => {
      const prayers = Object.values(record.prayers);
      const dayPoints = prayers.filter(Boolean).length;
      totalPoints += dayPoints;
      
      if (dayPoints === 5) {
        perfectDays++;
        perfectDayDates.push(record.date);
      }
    });
    
    // Calculate streak for perfect days
    let tempStreak = 0;
    for (let i = 0; i < perfectDayDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(perfectDayDates[i - 1]);
        const currDate = new Date(perfectDayDates[i]);
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
    
    if (perfectDayDates.length > 0) {
      const lastPerfectDate = new Date(perfectDayDates[perfectDayDates.length - 1]);
      lastPerfectDate.setHours(0, 0, 0, 0);
      
      if (lastPerfectDate.getTime() === today.getTime() || 
          lastPerfectDate.getTime() === yesterday.getTime()) {
        currentStreak = tempStreak;
      }
    }
    
    return {
      totalPoints,
      perfectDays,
      currentStreak,
      maxStreak,
      isWinner: maxStreak >= CAMPAIGN_CONFIG.streakTarget,
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

  return {
    members,
    attendance,
    addMember,
    removeMember,
    getAttendanceForDate,
    togglePrayer,
    getMemberStats,
    getLeaderboard,
    config: CAMPAIGN_CONFIG,
  };
}
