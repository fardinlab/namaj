import { cn } from '@/lib/utils';
import { PrayerName, PRAYER_NAMES } from '@/lib/types';
import { Check } from 'lucide-react';

interface PrayerToggleCardProps {
  prayer: PrayerName;
  isCompleted: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const prayerIcons: Record<PrayerName, string> = {
  fajr: '🌅',
  zuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌅',
  isha: '🌙',
};

export function PrayerToggleCard({ prayer, isCompleted, onToggle, disabled }: PrayerToggleCardProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative w-full p-6 rounded-xl border-2 transition-all duration-300',
        'flex flex-col items-center gap-3',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isCompleted
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-card border-border text-muted-foreground hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="text-4xl">{prayerIcons[prayer]}</span>
      <span className="text-lg font-semibold">{PRAYER_NAMES[prayer]}</span>
      
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}
