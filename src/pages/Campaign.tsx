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
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">ক্যাম্পেইনের তথ্য</h1>
        <p className="text-muted-foreground">৫০ দিনের জামাতে নামাজ উদ্যোগ</p>
      </div>

      {/* Status banner */}
      <Card className={
        hasEnded 
          ? 'border-muted bg-muted/50' 
          : hasStarted 
            ? 'border-primary bg-primary/5' 
            : 'border-amber-500 bg-amber-500/5'
      }>
        <CardContent className="py-4 text-center">
          {hasEnded ? (
            <p className="text-lg font-semibold">ক্যাম্পেইন সমাপ্ত হয়েছে</p>
          ) : hasStarted ? (
            <p className="text-lg font-semibold text-primary">
              ক্যাম্পেইন চলমান — দিন {toBanglaNumber(Math.min(currentDay, totalDays))} / {toBanglaNumber(totalDays)}
            </p>
          ) : (
            <p className="text-lg font-semibold text-amber-600">ক্যাম্পেইন শীঘ্রই শুরু হবে</p>
          )}
        </CardContent>
      </Card>

      {/* Campaign details */}
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              সময়সীমা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                শুরুর তারিখ
              </span>
              <span className="font-medium">{formatBanglaDate(startDate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                শেষের তারিখ
              </span>
              <span className="font-medium">{formatBanglaDate(endDate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                মোট দিন
              </span>
              <span className="font-medium">{toBanglaNumber(totalDays)} দিন</span>
            </div>
            {!hasEnded && (
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  বাকি দিন
                </span>
                <span className="font-medium text-primary">{toBanglaNumber(remainingDays)} দিন</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              লক্ষ্য ও নিয়ম
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="font-semibold text-primary mb-2">বিজয়ী হওয়ার শর্ত</p>
              <p className="text-sm text-muted-foreground">
                টানা {toBanglaNumber(config.streakTarget)} দিন সম্পূর্ণ ৫/৫ নামাজ আদায় করলে বিজয়ী ব্যাজ পাওয়া যাবে।
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">পয়েন্ট গণনা:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>প্রতিটি ওয়াক্ত নামাজ = ১ পয়েন্ট</li>
                <li>দৈনিক সর্বোচ্চ ৫ পয়েন্ট (৫ ওয়াক্ত)</li>
                <li>৫০ দিনে সর্বোচ্চ ২৫০ পয়েন্ট সম্ভব</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">পাঁচ ওয়াক্ত নামাজ:</h4>
              <div className="flex flex-wrap gap-2">
                {['ফজর', 'যোহর', 'আসর', 'মাগরিব', 'এশা'].map(prayer => (
                  <span key={prayer} className="bg-muted px-3 py-1 rounded-full text-sm">
                    {prayer}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              বর্তমান পরিসংখ্যান
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{toBanglaNumber(members.length)}</p>
                <p className="text-sm text-muted-foreground">মোট সদস্য</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{toBanglaNumber(totalPoints)}</p>
                <p className="text-sm text-muted-foreground">মোট পয়েন্ট</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{toBanglaNumber(winners)}</p>
                <p className="text-sm text-muted-foreground">বিজয়ী</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
