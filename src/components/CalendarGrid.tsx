import { useState } from 'react';
import { cn } from '@/lib/utils';
import { generateDateRange, toBanglaNumber, formatShortBanglaDate, getTotalDays, formatBanglaDate } from '@/lib/bangla-utils';
import { AttendanceRecord, CampaignConfig, PrayerName, PRAYER_NAMES } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

interface CalendarGridProps {
  attendance: AttendanceRecord[];
  memberId: string;
  config: CampaignConfig;
  onTogglePrayer?: (memberId: string, date: string, prayer: PrayerName) => void;
}

const prayerIcons: Record<PrayerName, string> = {
  fajr: '🌅',
  zuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌇',
  isha: '🌙',
};

export function CalendarGrid({ attendance, memberId, config, onTogglePrayer }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dates = generateDateRange(config.startDate, config.endDate);
  const totalDays = getTotalDays(config.startDate, config.endDate);
  
  // Get today's date string in local timezone
  const todayStr = new Date().toISOString().split('T')[0];
  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

  const getDateStatus = (date: Date): 'perfect' | 'partial' | 'missed' | 'future' => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Compare date strings to avoid timezone issues
    if (dateStr > todayStr) return 'future';
    
    const record = attendance.find(a => a.memberId === memberId && a.date === dateStr);
    if (!record) return 'missed';
    
    const prayerCount = Object.values(record.prayers).filter(Boolean).length;
    if (prayerCount === 5) return 'perfect';
    if (prayerCount > 0) return 'partial';
    return 'missed';
  };

  const isToday = (date: Date): boolean => {
    return date.toISOString().split('T')[0] === todayStr;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    // Only allow editing past or today, not future dates
    if (dateStr <= todayStr && onTogglePrayer) {
      setSelectedDate(date);
    }
  };

  const selectedDateStr = selectedDate?.toISOString().split('T')[0] || '';
  const selectedRecord = attendance.find(a => a.memberId === memberId && a.date === selectedDateStr);
  const selectedCompletedCount = selectedRecord 
    ? Object.values(selectedRecord.prayers).filter(Boolean).length 
    : 0;

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">{toBanglaNumber(totalDays)} দিনের ক্যালেন্ডার</h3>
        <p className="text-xs text-muted-foreground mb-4">
          যেকোনো তারিখে ক্লিক করে নামাজ এডিট করুন
        </p>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Weekday headers */}
          {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'].map(day => (
            <div key={day} className="text-xs text-center text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
          
          {/* Empty cells for alignment */}
          {Array.from({ length: (new Date(config.startDate).getDay() + 1) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {/* Date cells */}
          {dates.map((date, index) => {
            const status = getDateStatus(date);
            const isTodayDate = isToday(date);
            const isClickable = status !== 'future' && onTogglePrayer;
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!isClickable}
                title={formatShortBanglaDate(date)}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-all',
                  status === 'perfect' && 'bg-primary text-primary-foreground',
                  status === 'partial' && 'bg-amber-500/30 text-amber-700',
                  status === 'missed' && 'bg-destructive/20 text-destructive',
                  status === 'future' && 'bg-muted text-muted-foreground',
                  isTodayDate && 'ring-2 ring-primary ring-offset-2',
                  isClickable && 'cursor-pointer hover:scale-110 hover:shadow-md active:scale-95',
                  !isClickable && 'cursor-default'
                )}
              >
                {toBanglaNumber(date.getDate())}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>সম্পূর্ণ (৫/৫)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/30" />
            <span>আংশিক</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/20" />
            <span>বাদ পড়েছে</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>আগামী</span>
          </div>
        </div>
      </div>

      {/* Edit Prayer Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDate && formatBanglaDate(selectedDate)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i < selectedCompletedCount ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-primary">{toBanglaNumber(selectedCompletedCount)}/৫</span>
            </div>

            {/* Prayer Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {prayers.map(prayer => {
                const isCompleted = selectedRecord?.prayers[prayer] ?? false;
                return (
                  <button
                    key={prayer}
                    onClick={() => {
                      if (onTogglePrayer && selectedDateStr) {
                        onTogglePrayer(memberId, selectedDateStr, prayer);
                      }
                    }}
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

            <p className="text-xs text-center text-muted-foreground">
              নামাজ টগল করতে উপরের বাটনে ক্লিক করুন
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
