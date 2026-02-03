import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { formatBanglaDate, toBanglaNumber } from '@/lib/bangla-utils';
import { PRAYER_NAMES, PrayerName } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PrayerHistory() {
  const { members, attendance, config } = useCampaignData();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

  // Get all attendance records sorted by date (newest first)
  const getFilteredRecords = () => {
    let records = [...attendance];
    
    if (selectedMemberId !== 'all') {
      records = records.filter(r => r.memberId === selectedMemberId);
    }

    // Sort by date descending
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return records;
  };

  const filteredRecords = getFilteredRecords();

  // Group records by date
  const groupedByDate = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof filteredRecords>);

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'অজানা';
  };

  const getPrayerCount = (prayers: Record<string, boolean>) => {
    return Object.values(prayers).filter(Boolean).length;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">নামাজ আদায়ের তারিখ ও তালিকা</h1>
          <p className="text-sm text-muted-foreground">সকল নামাজের রেকর্ড</p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger>
              <SelectValue placeholder="সদস্য নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল সদস্য</SelectItem>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Records by Date */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">কোনো নামাজের রেকর্ড নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByDate).map(([date, records]) => (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="text-primary">
                    {formatBanglaDate(new Date(date))}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {toBanglaNumber(records.length)} জন
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {records.map(record => {
                  const prayerCount = getPrayerCount(record.prayers);
                  const isPerfect = prayerCount === 5;
                  
                  return (
                    <div 
                      key={`${record.date}-${record.memberId}`}
                      className={cn(
                        "p-3 rounded-lg border",
                        isPerfect ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {getMemberName(record.memberId)}
                        </span>
                        <Badge 
                          variant={isPerfect ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {toBanglaNumber(prayerCount)}/৫ ওয়াক্ত
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {prayers.map(prayer => {
                          const isCompleted = record.prayers[prayer];
                          return (
                            <div
                              key={prayer}
                              className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded text-xs",
                                isCompleted 
                                  ? "bg-primary/10 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>{PRAYER_NAMES[prayer]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
