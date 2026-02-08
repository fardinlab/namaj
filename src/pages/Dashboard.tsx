import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PrayerName, PRAYER_NAMES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Star, Calendar, Flame, Trophy, Moon, Sun, Sunrise, Sunset, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarGrid } from '@/components/CalendarGrid';
import { MemberSearch } from '@/components/MemberSearch';

const prayerConfig: Record<PrayerName, { icon: React.ElementType; gradient: string; bgGlow: string }> = {
  fajr: { icon: Sunrise, gradient: 'from-amber-400 to-orange-500', bgGlow: 'bg-amber-500/20' },
  zuhr: { icon: Sun, gradient: 'from-yellow-400 to-amber-500', bgGlow: 'bg-yellow-500/20' },
  asr: { icon: CloudSun, gradient: 'from-orange-400 to-red-500', bgGlow: 'bg-orange-500/20' },
  maghrib: { icon: Sunset, gradient: 'from-rose-400 to-purple-500', bgGlow: 'bg-rose-500/20' },
  isha: { icon: Moon, gradient: 'from-indigo-400 to-purple-600', bgGlow: 'bg-indigo-500/20' },
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
        <Card className="text-center py-12 border-dashed border-2 bg-gradient-to-br from-card to-muted/30">
          <CardContent className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">🕌</span>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">স্বাগতম!</h2>
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
    <div className="max-w-lg mx-auto px-4 space-y-6 pb-8">
      {/* Header with Date */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
          <Calendar className="h-3.5 w-3.5" />
          {formatBanglaDate(today)}
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          নামাজ ট্র্যাকার
        </h1>
      </div>

      {/* Member Search with Camera */}
      <MemberSearch 
        members={members} 
        onSelectMember={setSelectedMemberId}
        selectedMemberId={selectedMemberId}
      />

      {selectedMember && (
        <div className="space-y-5 animate-fade-in">
          {/* Selected Member Card */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                {selectedMember.photo ? (
                  <img 
                    src={selectedMember.photo} 
                    alt={selectedMember.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{selectedMember.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                  <p className="text-xs text-muted-foreground">আজকের অগ্রগতি</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{toBanglaNumber(completedToday)}<span className="text-base text-muted-foreground">/৫</span></div>
                  <p className="text-[10px] text-muted-foreground">ওয়াক্ত সম্পন্ন</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(completedToday / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Prayer Buttons - Grid */}
              <div className="grid grid-cols-5 gap-2">
                {prayers.map(prayer => {
                  const isCompleted = todayAttendance?.prayers[prayer] ?? false;
                  const config = prayerConfig[prayer];
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={prayer}
                      onClick={() => togglePrayer(selectedMemberId, todayStr, prayer)}
                      className={cn(
                        'relative flex flex-col items-center py-3 px-1 rounded-2xl transition-all duration-300',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95',
                        isCompleted
                          ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg`
                          : `${config.bgGlow} text-muted-foreground hover:shadow-md`
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mb-1", isCompleted ? "text-white" : "")} />
                      <span className="text-[10px] font-medium leading-tight">{PRAYER_NAMES[prayer]}</span>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-4 gap-3">
              <StatCard 
                icon={<Star className="h-5 w-5" />}
                value={stats.totalPoints}
                label="পয়েন্ট"
                gradient="from-primary/20 to-primary/5"
                iconColor="text-primary"
              />
              <StatCard 
                icon={<Calendar className="h-5 w-5" />}
                value={stats.activeDays}
                label="দিন"
                gradient="from-emerald-500/20 to-emerald-500/5"
                iconColor="text-emerald-600"
              />
              <StatCard 
                icon={<Flame className="h-5 w-5" />}
                value={stats.currentStreak}
                label="ধারা"
                gradient="from-amber-500/20 to-amber-500/5"
                iconColor="text-amber-600"
              />
              <StatCard 
                icon={<Trophy className="h-5 w-5" />}
                value={stats.maxStreak}
                label="সর্বোচ্চ"
                gradient="from-purple-500/20 to-purple-500/5"
                iconColor="text-purple-600"
              />
            </div>
          )}

          {/* Winner Badge */}
          {stats?.isWinner && (
            <Card className="border-0 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-bold text-white text-lg">৪১ দিনের চ্যালেঞ্জ সম্পন্ন!</p>
                <p className="text-white/80 text-sm mt-1">মাশাআল্লাহ, অভিনন্দন!</p>
              </div>
            </Card>
          )}

          {/* Progress to 41 days */}
          {stats && !stats.isWinner && stats.qualifyingDays > 0 && (
            <Card className="border-0 shadow-md bg-gradient-to-br from-card to-muted/20">
              <CardContent className="p-4">
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
                    className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-500 relative"
                    style={{ width: `${Math.min((stats.maxStreak / 41) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
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
            onTogglePrayer={togglePrayer}
          />
        </div>
      )}

      {!selectedMember && members.length > 0 && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">👆</span>
            </div>
            <p className="text-muted-foreground">
              উপরে থেকে সদস্য নির্বাচন করুন বা ক্যামেরা দিয়ে স্ক্যান করুন
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Enhanced stat card component
function StatCard({ 
  icon, 
  value, 
  label, 
  gradient,
  iconColor
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  gradient: string;
  iconColor: string;
}) {
  return (
    <Card className={cn("border-0 shadow-sm overflow-hidden")}>
      <div className={cn("bg-gradient-to-br p-3 h-full", gradient)}>
        <div className={cn("mb-2", iconColor)}>
          {icon}
        </div>
        <p className="text-xl font-bold text-foreground leading-none">{toBanglaNumber(value)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </Card>
  );
}
