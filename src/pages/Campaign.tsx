import { useCampaignData } from '@/hooks/useCampaignData';
import { formatBanglaDate, toBanglaNumber, getTotalDays, getRemainingDays, getDayNumber } from '@/lib/bangla-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Target, Clock, Flag, Users, Star } from 'lucide-react';

export default function Campaign() {
  const { config, members, getLeaderboard } = useCampaignData();
  
  const today = new Date();
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  const totalDays = getTotalDays(config.startDate, config.endDate);
  const remainingDays = getRemainingDays(config.endDate, today);
  const currentDay = getDayNumber(config.startDate, today);
  
  const totalPoints = getLeaderboard.reduce((sum, m) => sum + m.stats.totalPoints, 0);
  const winners = getLeaderboard.filter(m => m.stats.isWinner).length;

  const hasStarted = today >= startDate;
  const hasEnded = today > endDate;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1 font-serif">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <h1 className="text-2xl font-serif font-bold mb-2">ক্যাম্পেইনের তথ্য</h1>
        <p className="text-muted-foreground text-sm">৫০ দিনের জামাতে নামাজ উদ্যোগ</p>
      </div>

      {/* Status banner */}
      <Card className={cn(
        'border-0 shadow-soft overflow-hidden',
        hasEnded 
          ? 'bg-muted' 
          : hasStarted 
            ? 'bg-primary/5' 
            : 'bg-secondary/5'
      )}>
        <div className={cn(
          'h-1',
          hasEnded ? 'bg-muted-foreground/30' : hasStarted ? 'bg-primary' : 'bg-secondary'
        )} />
        <CardContent className="py-5 text-center">
          {hasEnded ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🏁</span>
              <p className="text-lg font-serif font-semibold">ক্যাম্পেইন সমাপ্ত হয়েছে</p>
            </div>
          ) : hasStarted ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🕌</span>
              <p className="text-lg font-serif font-semibold text-primary">
                ক্যাম্পেইন চলমান — দিন {toBanglaNumber(Math.min(currentDay, totalDays))} / {toBanglaNumber(totalDays)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⏳</span>
              <p className="text-lg font-serif font-semibold text-secondary">ক্যাম্পেইন শীঘ্রই শুরু হবে</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign details */}
      <div className="grid gap-4">
        {/* Timeline Card */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              সময়সীমা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                শুরুর তারিখ
              </span>
              <span className="font-medium">{formatBanglaDate(startDate)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                শেষের তারিখ
              </span>
              <span className="font-medium">{formatBanglaDate(endDate)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                মোট দিন
              </span>
              <span className="font-medium">{toBanglaNumber(totalDays)} দিন</span>
            </div>
            {!hasEnded && (
              <div className="flex justify-between items-center py-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  বাকি দিন
                </span>
                <span className="font-medium text-primary">{toBanglaNumber(remainingDays)} দিন</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rules Card */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              লক্ষ্য ও নিয়ম
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Winner condition */}
            <div className="bg-secondary/10 rounded-xl p-4">
              <p className="font-serif font-semibold text-secondary mb-2">🏆 বিজয়ী হওয়ার শর্ত</p>
              <p className="text-sm text-muted-foreground">
                টানা {toBanglaNumber(config.streakTarget)} দিন ফজর ও এশা উভয় নামাজ জামাতে আদায় করলে বিজয়ী ব্যাজ পাওয়া যাবে।
              </p>
            </div>

            {/* Points system */}
            <div className="space-y-2">
              <h4 className="font-medium font-serif">পয়েন্ট গণনা:</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  প্রতিটি ওয়াক্ত নামাজ = ১ পয়েন্ট
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  দৈনিক সর্বোচ্চ ৫ পয়েন্ট (৫ ওয়াক্ত)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ৫০ দিনে সর্বোচ্চ ২৫০ পয়েন্ট সম্ভব
                </li>
              </ul>
            </div>

            {/* Five prayers */}
            <div className="space-y-3">
              <h4 className="font-medium font-serif">পাঁচ ওয়াক্ত নামাজ:</h4>
              <div className="flex flex-wrap gap-2">
                {['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'এশা'].map(prayer => (
                  <span key={prayer} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                    {prayer}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current stats */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              বর্তমান পরিসংখ্যান
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-primary">{toBanglaNumber(members.length)}</p>
                <p className="text-xs text-muted-foreground mt-1">মোট সদস্য</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-primary">{toBanglaNumber(totalPoints)}</p>
                <p className="text-xs text-muted-foreground mt-1">মোট পয়েন্ট</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-secondary">{toBanglaNumber(winners)}</p>
                <p className="text-xs text-muted-foreground mt-1">বিজয়ী</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground font-serif italic">
          "নামাজ হলো মু'মিন এবং কাফিরের মধ্যে পার্থক্যকারী"
        </p>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
