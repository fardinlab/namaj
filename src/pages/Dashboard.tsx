import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PrayerName, PRAYER_NAMES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Star, Calendar, Flame, Trophy, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarGrid } from '@/components/CalendarGrid';

const prayerIcons: Record<PrayerName, string> = {
  fajr: '🌅',
  zuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌇',
  isha: '🌙',
};

export default function Dashboard() {
  const { members, attendance, getAttendanceForDate, togglePrayer, getMemberStats, config } = useCampaignData();
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
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-4">
            <div className="text-6xl">🕌</div>
            <div>
              <h2 className="text-xl font-bold mb-1">স্বাগতম!</h2>
              <p className="text-sm text-muted-foreground">
                প্রথমে সদস্য তালিকায় গিয়ে নতুন সদস্য যোগ করুন।
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 space-y-5 pb-8">
      {/* Header with Date */}
      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground mb-1">{formatBanglaDate(today)}</p>
        <h1 className="text-xl font-bold text-foreground">নামাজ ট্র্যাকার</h1>
      </div>

      {/* Member Selector - Compact */}
      <div className="relative">
        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
          <SelectTrigger className="w-full h-12 text-base bg-card border-2 border-border focus:border-primary">
            <SelectValue placeholder="সদস্য নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent>
            {members.map(member => (
              <SelectItem key={member.id} value={member.id} className="text-base py-3">
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMember && (
        <>
          {/* Prayer Toggle Grid - Compact & Touch-friendly */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">আজকের নামাজ</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          i < completedToday ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-primary ml-1">{toBanglaNumber(completedToday)}/৫</span>
                </div>
              </div>

              {/* Prayer Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {prayers.map(prayer => {
                  const isCompleted = todayAttendance?.prayers[prayer] ?? false;
                  return (
                    <button
                      key={prayer}
                      onClick={() => togglePrayer(selectedMemberId, todayStr, prayer)}
                      className={cn(
                        'relative flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50',
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted active:scale-95'
                      )}
                    >
                      <span className="text-xl mb-1">{prayerIcons[prayer]}</span>
                      <span className="text-[10px] font-medium leading-tight">{PRAYER_NAMES[prayer]}</span>
                      {isCompleted && (
                        <Check className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid - Clean & Minimal */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              <StatItem 
                icon={<Star className="h-4 w-4" />}
                value={stats.totalPoints}
                label="পয়েন্ট"
                color="text-primary"
                bgColor="bg-primary/10"
              />
              <StatItem 
                icon={<Calendar className="h-4 w-4" />}
                value={stats.activeDays}
                label="দিন"
                color="text-green-600"
                bgColor="bg-green-500/10"
              />
              <StatItem 
                icon={<Flame className="h-4 w-4" />}
                value={stats.currentStreak}
                label="ধারা"
                color="text-amber-600"
                bgColor="bg-amber-500/10"
              />
              <StatItem 
                icon={<Trophy className="h-4 w-4" />}
                value={stats.maxStreak}
                label="সর্বোচ্চ"
                color="text-muted-foreground"
                bgColor="bg-muted"
              />
            </div>
          )}

          {/* Winner Badge */}
          {stats?.isWinner && (
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl p-4 text-center border border-primary/30">
              <div className="text-2xl mb-1">🏆</div>
              <p className="font-bold text-primary">৪১ দিনের চ্যালেঞ্জ সম্পন্ন!</p>
              <p className="text-xs text-muted-foreground mt-1">মাশাআল্লাহ, অভিনন্দন!</p>
            </div>
          )}

          {/* Progress to 41 days - Compact */}
          {stats && !stats.isWinner && stats.maxStreak > 0 && (
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">৪১ দিনের লক্ষ্য</span>
                <span className="text-xs font-medium">{toBanglaNumber(stats.maxStreak)}/৪১</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.maxStreak / 41) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Calendar */}
          <CalendarGrid attendance={attendance} memberId={selectedMemberId} config={config} />
        </>
      )}
    </div>
  );
}

// Compact stat item component
function StatItem({ 
  icon, 
  value, 
  label, 
  color, 
  bgColor 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
  bgColor: string;
}) {
  return (
    <div className={cn("rounded-xl p-3 text-center", bgColor)}>
      <div className={cn("flex justify-center mb-1", color)}>
        {icon}
      </div>
      <p className="text-lg font-bold text-foreground leading-none">{toBanglaNumber(value)}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
