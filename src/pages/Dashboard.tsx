import { useState } from 'react';
import { useCloudCampaignData } from '@/hooks/useCloudCampaignData';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PrayerName, PRAYER_NAMES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Star, Calendar, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarGrid } from '@/components/CalendarGrid';
import { MemberSearch } from '@/components/MemberSearch';
import { toast } from 'sonner';

// Prayer icons as soft, Islamic-inspired designs
const prayerConfig: Record<PrayerName, { label: string; time: string }> = {
  fajr: { label: 'ফজর', time: 'ভোর' },
  zuhr: { label: 'যোহর', time: 'দুপুর' },
  asr: { label: 'আসর', time: 'বিকাল' },
  maghrib: { label: 'মাগরিব', time: 'সন্ধ্যা' },
  isha: { label: 'এশা', time: 'রাত' },
};

export default function Dashboard() {
  const { 
    members, 
    attendance, 
    getAttendanceForDate, 
    togglePrayer, 
    getMemberStats, 
    config,
    loading 
  } = useCloudCampaignData();
  
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const todayAttendance = selectedMemberId ? getAttendanceForDate(selectedMemberId, todayStr) : undefined;
  const stats = selectedMemberId ? getMemberStats(selectedMemberId) : null;

  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];
  const completedToday = todayAttendance ? Object.values(todayAttendance.prayers).filter(Boolean).length : 0;

  const handleTogglePrayer = async (memberId: string, date: string, prayer: PrayerName) => {
    try {
      await togglePrayer(memberId, date, prayer);
    } catch (error) {
      console.error('Error toggling prayer:', error);
      toast.error('নামাজ আপডেট করতে সমস্যা হয়েছে');
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-8">
        <div className="text-center pt-4 pb-2">
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-6 w-36 mx-auto" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="text-center py-12 border-dashed border-2 shadow-soft">
          <CardContent className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">🕌</span>
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold mb-2">বিসমিল্লাহ</h2>
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
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      {/* Header with Islamic greeting */}
      <div className="text-center pt-4 pb-2">
        <p className="text-sm text-muted-foreground mb-1 font-serif">
          ٱلسَّلَامُ عَلَيْكُمْ
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
          <Calendar className="h-3.5 w-3.5" />
          {formatBanglaDate(today)}
        </div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          নামাজ ট্র্যাকার
        </h1>
      </div>

      {/* Member Search */}
      <MemberSearch 
        members={members} 
        onSelectMember={setSelectedMemberId}
        selectedMemberId={selectedMemberId}
      />

      {selectedMember && (
        <div className="space-y-5 animate-fade-in">
          {/* Selected Member Card */}
          <Card className="overflow-hidden shadow-soft border-0">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-secondary/60" />
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-5">
                {selectedMember.photo ? (
                  <img 
                    src={selectedMember.photo} 
                    alt={selectedMember.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 shadow-soft"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-soft">
                    <span className="text-xl font-serif font-bold text-primary">{selectedMember.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-serif font-semibold text-lg">{selectedMember.name}</h3>
                  <p className="text-xs text-muted-foreground">আজকের নামাজ</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{toBanglaNumber(completedToday)}<span className="text-base text-muted-foreground">/৫</span></div>
                  <p className="text-[10px] text-muted-foreground">ওয়াক্ত সম্পন্ন</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(completedToday / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Prayer Pills - Calm design */}
              <div className="grid grid-cols-5 gap-2">
                {prayers.map(prayer => {
                  const isCompleted = todayAttendance?.prayers[prayer] ?? false;
                  
                  return (
                    <button
                      key={prayer}
                      onClick={() => handleTogglePrayer(selectedMemberId, todayStr, prayer)}
                      className={cn(
                        'relative flex flex-col items-center py-3 px-2 rounded-2xl transition-all duration-300',
                        'focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95',
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      <span className="text-[10px] opacity-70 mb-0.5">{prayerConfig[prayer].time}</span>
                      <span className="text-xs font-medium">{PRAYER_NAMES[prayer]}</span>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-sm">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid - Calm design */}
          {stats && (
            <div className="grid grid-cols-4 gap-3">
              <StatCard 
                icon={<Star className="h-4 w-4" />}
                value={stats.totalPoints}
                label="পয়েন্ট"
                variant="primary"
              />
              <StatCard 
                icon={<Calendar className="h-4 w-4" />}
                value={stats.activeDays}
                label="দিন"
                variant="success"
              />
              <StatCard 
                icon={<Flame className="h-4 w-4" />}
                value={stats.currentStreak}
                label="ধারা"
                variant="accent"
              />
              <StatCard 
                icon={<Trophy className="h-4 w-4" />}
                value={stats.maxStreak}
                label="সর্বোচ্চ"
                variant="secondary"
              />
            </div>
          )}

          {/* Winner Badge - Elegant Islamic design */}
          {stats?.isWinner && (
            <Card className="border-0 overflow-hidden shadow-soft">
              <div className="bg-gradient-to-r from-secondary via-secondary/90 to-secondary p-5 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-serif font-bold text-secondary-foreground text-lg">৪১ দিনের চ্যালেঞ্জ সম্পন্ন!</p>
                <p className="text-secondary-foreground/80 text-sm mt-1">মাশাআল্লাহ, বারাকাল্লাহু ফীক</p>
              </div>
            </Card>
          )}

          {/* Progress to 41 days */}
          {stats && !stats.isWinner && stats.qualifyingDays > 0 && (
            <Card className="border-0 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">৪১ দিনের লক্ষ্য</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{toBanglaNumber(stats.maxStreak)}/৪১</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.maxStreak / 41) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">ফজর + এশা প্রতিদিন পড়ে ৪১ দিন চালিয়ে যান</p>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <CalendarGrid 
            attendance={attendance} 
            memberId={selectedMemberId} 
            config={config} 
            onTogglePrayer={handleTogglePrayer}
          />
        </div>
      )}

      {!selectedMember && members.length > 0 && (
        <Card className="border-dashed border-2 shadow-soft">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">☝️</span>
            </div>
            <p className="text-muted-foreground">
              উপরে থেকে সদস্য নির্বাচন করুন
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Calm stat card component
function StatCard({ 
  icon, 
  value, 
  label, 
  variant = 'primary'
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  variant?: 'primary' | 'success' | 'accent' | 'secondary';
}) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/20 text-accent-foreground',
    secondary: 'bg-secondary/10 text-secondary',
  };

  return (
    <Card className="border-0 shadow-soft overflow-hidden">
      <CardContent className="p-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", variantStyles[variant])}>
          {icon}
        </div>
        <p className="text-xl font-bold text-foreground leading-none">{toBanglaNumber(value)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
