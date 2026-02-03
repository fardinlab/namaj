import { cn } from '@/lib/utils';
import { generateDateRange, toBanglaNumber, formatShortBanglaDate } from '@/lib/bangla-utils';
import { AttendanceRecord, CAMPAIGN_CONFIG } from '@/lib/types';

interface CalendarGridProps {
  attendance: AttendanceRecord[];
  memberId: string;
}

export function CalendarGrid({ attendance, memberId }: CalendarGridProps) {
  const dates = generateDateRange(CAMPAIGN_CONFIG.startDate, CAMPAIGN_CONFIG.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDateStatus = (date: Date): 'perfect' | 'partial' | 'missed' | 'future' => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (date > today) return 'future';
    
    const record = attendance.find(a => a.memberId === memberId && a.date === dateStr);
    if (!record) return 'missed';
    
    const prayerCount = Object.values(record.prayers).filter(Boolean).length;
    if (prayerCount === 5) return 'perfect';
    if (prayerCount > 0) return 'partial';
    return 'missed';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">৫০ দিনের ক্যালেন্ডার</h3>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Weekday headers */}
        {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র'].map(day => (
          <div key={day} className="text-xs text-center text-muted-foreground font-medium py-1">
            {day}
          </div>
        ))}
        
        {/* Empty cells for alignment */}
        {Array.from({ length: (new Date(CAMPAIGN_CONFIG.startDate).getDay() + 1) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {/* Date cells */}
        {dates.map((date, index) => {
          const status = getDateStatus(date);
          const isToday = date.getTime() === today.getTime();
          
          return (
            <div
              key={index}
              title={formatShortBanglaDate(date)}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors',
                status === 'perfect' && 'bg-primary text-primary-foreground',
                status === 'partial' && 'bg-amber-500/30 text-amber-700',
                status === 'missed' && 'bg-destructive/20 text-destructive',
                status === 'future' && 'bg-muted text-muted-foreground',
                isToday && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              {toBanglaNumber(date.getDate())}
            </div>
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
  );
}
