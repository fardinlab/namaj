import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PrayerToggleCard } from '@/components/PrayerToggleCard';
import { StatsCard } from '@/components/StatsCard';
import { CalendarGrid } from '@/components/CalendarGrid';
import { PrayerName, PRAYER_NAMES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Calendar, Flame, Trophy, Target } from 'lucide-react';

export default function Dashboard() {
  const { members, attendance, getAttendanceForDate, togglePrayer, getMemberStats } = useCampaignData();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const todayAttendance = selectedMemberId ? getAttendanceForDate(selectedMemberId, todayStr) : undefined;
  const stats = selectedMemberId ? getMemberStats(selectedMemberId) : null;

  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
  const completedToday = todayAttendance ? Object.values(todayAttendance.prayers).filter(Boolean).length : 0;

  if (members.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🕌</div>
            <h2 className="text-2xl font-bold mb-2">স্বাগতম!</h2>
            <p className="text-muted-foreground mb-4">
              নামাজ উপস্থিতি ক্যাম্পেইনে আপনাকে স্বাগতম। প্রথমে সদস্য তালিকায় গিয়ে নতুন সদস্য যোগ করুন।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          আজকের নামাজের হিসাব
        </h1>
        <p className="text-lg text-muted-foreground">
          {formatBanglaDate(today)}
        </p>
      </div>

      {/* Member selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">সদস্য নির্বাচন করুন</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="সদস্য নির্বাচন করুন..." />
            </SelectTrigger>
            <SelectContent>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMember && (
        <>
          {/* Today's progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>আজ সম্পন্ন:</span>
                <span className="text-primary">{toBanglaNumber(completedToday)}/৫</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {prayers.map(prayer => (
                  <PrayerToggleCard
                    key={prayer}
                    prayer={prayer}
                    isCompleted={todayAttendance?.prayers[prayer] ?? false}
                    onToggle={() => togglePrayer(selectedMemberId, todayStr, prayer)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard
                label="মোট পয়েন্ট"
                value={stats.totalPoints}
                variant="primary"
                icon={<Star className="h-5 w-5 text-primary" />}
              />
              <StatsCard
                label="সম্পূর্ণ দিন"
                value={stats.perfectDays}
                variant="success"
                icon={<Calendar className="h-5 w-5 text-green-600" />}
              />
              <StatsCard
                label="চলমান ধারাবাহিকতা"
                value={stats.currentStreak}
                suffix="দিন"
                variant="warning"
                icon={<Flame className="h-5 w-5 text-amber-600" />}
              />
              <StatsCard
                label="সর্বোচ্চ ধারাবাহিকতা"
                value={stats.maxStreak}
                suffix="দিন"
                variant="default"
                icon={<Trophy className="h-5 w-5 text-muted-foreground" />}
              />
            </div>
          )}

          {/* 41-day streak target */}
          {stats && (
            <Card className={stats.isWinner ? 'border-primary bg-primary/5' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className={`h-6 w-6 ${stats.isWinner ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium">৪১ দিনের ধারাবাহিকতা লক্ষ্য</p>
                      <p className="text-sm text-muted-foreground">
                        বর্তমান: {toBanglaNumber(stats.maxStreak)} / ৪১ দিন
                      </p>
                    </div>
                  </div>
                  {stats.isWinner && (
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                      🏆 বিজয়ী!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <CalendarGrid attendance={attendance} memberId={selectedMemberId} />
        </>
      )}
    </div>
  );
}
