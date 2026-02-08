import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, XCircle, User, TrendingUp } from 'lucide-react';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PRAYER_NAMES, PrayerName } from '@/lib/types';
import { cn } from '@/lib/utils';

// Rakat count for each prayer
const RAKAT_COUNT: Record<PrayerName, number> = {
  fajr: 2,
  zuhr: 4,
  asr: 4,
  maghrib: 3,
  isha: 4,
};

const TOTAL_DAILY_RAKAT = 17; // 2+4+4+3+4

export default function PrayerHistory() {
  const { members, attendance } = useCampaignData();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Get member's attendance records sorted by date (newest first)
  const getMemberRecords = () => {
    if (!selectedMemberId) return [];
    return [...attendance]
      .filter(r => r.memberId === selectedMemberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const memberRecords = getMemberRecords();

  // Calculate statistics for selected member
  const getStats = () => {
    if (!memberRecords.length) return null;

    let totalPrayers = 0;
    let totalRakat = 0;
    let missedPrayers = 0;
    let missedRakat = 0;
    let daysWithFajrIsha = 0;

    memberRecords.forEach(record => {
      prayers.forEach(prayer => {
        if (record.prayers[prayer]) {
          totalPrayers++;
          totalRakat += RAKAT_COUNT[prayer];
        } else {
          missedPrayers++;
          missedRakat += RAKAT_COUNT[prayer];
        }
      });

      if (record.prayers.fajr && record.prayers.isha) {
        daysWithFajrIsha++;
      }
    });

    return {
      totalDays: memberRecords.length,
      totalPrayers,
      totalRakat,
      missedPrayers,
      missedRakat,
      daysWithFajrIsha,
    };
  };

  const stats = getStats();

  const getPrayerCount = (prayerRecord: Record<string, boolean>) => {
    return Object.values(prayerRecord).filter(Boolean).length;
  };

  const getRakatCompleted = (prayerRecord: Record<string, boolean>) => {
    let rakat = 0;
    prayers.forEach(prayer => {
      if (prayerRecord[prayer]) {
        rakat += RAKAT_COUNT[prayer];
      }
    });
    return rakat;
  };

  const getMissedRakat = (prayerRecord: Record<string, boolean>) => {
    let missed = 0;
    prayers.forEach(prayer => {
      if (!prayerRecord[prayer]) {
        missed += RAKAT_COUNT[prayer];
      }
    });
    return missed;
  };

  if (members.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12 border-0 shadow-soft">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">প্রথমে সদস্য যোগ করুন</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-serif font-bold mb-2">নামাজের ইতিহাস</h1>
        <p className="text-sm text-muted-foreground">প্রতিটি সদস্যের বিস্তারিত রেকর্ড</p>
      </div>

      {/* Member Selector */}
      <Card className="border-0 shadow-soft">
        <CardContent className="pt-4">
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="h-12 text-base rounded-xl">
              <SelectValue placeholder="সদস্য নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {members.map(member => (
                <SelectItem key={member.id} value={member.id} className="py-3">
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedMemberId ? (
        <Card className="border-0 shadow-soft">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">একজন সদস্য নির্বাচন করুন</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          {stats && (
            <Card className="border-0 shadow-soft overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  {selectedMember?.name} - সামগ্রিক পরিসংখ্যান
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{toBanglaNumber(stats.totalDays)}</p>
                    <p className="text-xs text-muted-foreground">মোট দিন</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-success">{toBanglaNumber(stats.daysWithFajrIsha)}</p>
                    <p className="text-xs text-muted-foreground">ফজর+এশা দিন</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{toBanglaNumber(stats.totalRakat)}</p>
                    <p className="text-xs text-muted-foreground">পড়া রাকাত</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{toBanglaNumber(stats.missedRakat)}</p>
                    <p className="text-xs text-muted-foreground">বাদ রাকাত</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">মোট ওয়াক্ত পড়েছে:</span>
                    <span className="font-medium text-primary">{toBanglaNumber(stats.totalPrayers)} ওয়াক্ত</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">বাদ পড়েছে:</span>
                    <span className="font-medium text-destructive">{toBanglaNumber(stats.missedPrayers)} ওয়াক্ত</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Records */}
          {memberRecords.length === 0 ? (
            <Card className="border-0 shadow-soft">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">এই সদস্যের কোনো নামাজের রেকর্ড নেই</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                তারিখভিত্তিক বিস্তারিত ({toBanglaNumber(memberRecords.length)} দিন)
              </h3>
              
              {memberRecords.map((record, index) => {
                const prayerCount = getPrayerCount(record.prayers);
                const rakatCompleted = getRakatCompleted(record.prayers);
                const missedRakat = getMissedRakat(record.prayers);
                const isPerfect = prayerCount === 5;
                const hasFajrIsha = record.prayers.fajr && record.prayers.isha;

                return (
                  <Card 
                    key={record.date}
                    className={cn(
                      "border-0 shadow-soft overflow-hidden",
                      isPerfect && "ring-1 ring-primary/30"
                    )}
                  >
                    {isPerfect && <div className="h-0.5 bg-primary" />}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-serif">
                            {formatBanglaDate(new Date(record.date))}
                          </span>
                          {hasFajrIsha && (
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 rounded-full">
                              ফজর+এশা ✓
                            </Badge>
                          )}
                        </div>
                        <Badge variant={isPerfect ? "default" : "secondary"} className="text-xs rounded-full">
                          {toBanglaNumber(prayerCount)}/৫
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Prayer Status */}
                      <div className="flex gap-1.5 flex-wrap">
                        {prayers.map(prayer => {
                          const isCompleted = record.prayers[prayer];
                          return (
                            <div
                              key={prayer}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                isCompleted 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{PRAYER_NAMES[prayer]}</span>
                              <span className="opacity-70">({toBanglaNumber(RAKAT_COUNT[prayer])})</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Rakat Summary */}
                      <div className="flex gap-4 text-xs pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">পড়া রাকাত:</span>
                          <span className="font-bold text-primary">{toBanglaNumber(rakatCompleted)}/{toBanglaNumber(TOTAL_DAILY_RAKAT)}</span>
                        </div>
                        {missedRakat > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">বাদ:</span>
                            <span className="font-bold text-destructive">{toBanglaNumber(missedRakat)} রাকাত</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
