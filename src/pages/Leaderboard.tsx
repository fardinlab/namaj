import { useCampaignData } from '@/hooks/useCampaignData';
import { toBanglaNumber } from '@/lib/bangla-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

// Islamic medal icons
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-soft">
        <span className="text-lg">🥇</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-soft">
        <span className="text-lg">🥈</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-soft">
        <span className="text-lg">🥉</span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
      <span className="text-sm font-bold text-muted-foreground">{toBanglaNumber(rank)}</span>
    </div>
  );
};

export default function Leaderboard() {
  const { getLeaderboard } = useCampaignData();

  if (getLeaderboard.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">অগ্রগামী সদস্যবৃন্দ</h1>
          <p className="text-muted-foreground">সম্মানিত নামাজি ভাইয়েরা</p>
        </div>
        <Card className="text-center py-12 shadow-soft border-0">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-muted-foreground">
              এখনো কোনো সদস্য যোগ করা হয়নি। সদস্য তালিকায় গিয়ে সদস্য যোগ করুন।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1 font-serif">بِسْمِ اللهِ</p>
        <h1 className="text-2xl font-serif font-bold mb-2">অগ্রগামী সদস্যবৃন্দ</h1>
        <p className="text-muted-foreground text-sm">মোট পয়েন্টের ভিত্তিতে সম্মানসূচী</p>
      </div>

      {/* Leaderboard cards */}
      <div className="space-y-3">
        {getLeaderboard.map((member, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          
          return (
            <Card
              key={member.id}
              className={cn(
                'transition-all shadow-soft border-0 overflow-hidden',
                isTopThree && 'ring-1 ring-secondary/20'
              )}
            >
              {/* Top accent for top 3 */}
              {isTopThree && (
                <div className={cn(
                  'h-0.5',
                  rank === 1 && 'bg-secondary',
                  rank === 2 && 'bg-gray-400',
                  rank === 3 && 'bg-amber-600'
                )} />
              )}
              
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <RankBadge rank={rank} />

                  {/* Member info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'font-serif font-semibold truncate',
                        isTopThree && 'text-lg'
                      )}>
                        {member.name}
                      </h3>
                      {member.stats.isWinner && (
                        <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full shrink-0 font-medium">
                          বিজয়ী
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {toBanglaNumber(member.stats.activeDays)} দিন
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5" />
                        {toBanglaNumber(member.stats.currentStreak)} ধারা
                      </span>
                    </div>
                  </div>

                  {/* Points - Elegant display */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        rank === 1 ? 'bg-secondary/20' : 'bg-primary/10'
                      )}>
                        <Star className={cn(
                          'h-4 w-4',
                          rank === 1 ? 'text-secondary' : 'text-primary'
                        )} />
                      </div>
                      <span className={cn(
                        'font-bold',
                        isTopThree ? 'text-2xl' : 'text-xl'
                      )}>
                        {toBanglaNumber(member.stats.totalPoints)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">পয়েন্ট</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground font-serif">
          "যে ব্যক্তি ফজর ও এশার নামাজ জামাতে আদায় করে, সে যেন সারা রাত ইবাদত করল"
        </p>
      </div>
    </div>
  );
}
