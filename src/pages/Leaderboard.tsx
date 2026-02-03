import { useCampaignData } from '@/hooks/useCampaignData';
import { toBanglaNumber } from '@/lib/bangla-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Star, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { getLeaderboard } = useCampaignData();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{toBanglaNumber(rank)}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30';
      default:
        return '';
    }
  };

  if (getLeaderboard.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">অগ্রগামী সদস্যবৃন্দ</h1>
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-5xl mb-4">🏆</div>
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
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">অগ্রগামী সদস্যবৃন্দ</h1>
        <p className="text-muted-foreground">মোট পয়েন্টের ভিত্তিতে র‍্যাংকিং</p>
      </div>

      <div className="space-y-3">
        {getLeaderboard.map((member, index) => {
          const rank = index + 1;
          
          return (
            <Card
              key={member.id}
              className={cn(
                'transition-all hover:shadow-md',
                getRankStyle(rank)
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* Member info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'font-semibold truncate',
                        rank <= 3 && 'text-lg'
                      )}>
                        {member.name}
                      </h3>
                      {member.stats.isWinner && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full shrink-0">
                          বিজয়ী
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {toBanglaNumber(member.stats.perfectDays)} দিন
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" />
                        {toBanglaNumber(member.stats.maxStreak)} ধারা
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className={cn(
                        'h-5 w-5',
                        rank === 1 ? 'text-yellow-500' : 'text-primary'
                      )} />
                      <span className={cn(
                        'font-bold',
                        rank === 1 ? 'text-2xl' : 'text-xl'
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
    </div>
  );
}
