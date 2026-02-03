import { cn } from '@/lib/utils';
import { toBanglaNumber } from '@/lib/bangla-utils';

interface StatsCardProps {
  label: string;
  value: number;
  suffix?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, suffix, variant = 'default', icon }: StatsCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        variant === 'default' && 'bg-card border-border',
        variant === 'primary' && 'bg-primary/10 border-primary/30',
        variant === 'success' && 'bg-green-500/10 border-green-500/30',
        variant === 'warning' && 'bg-amber-500/10 border-amber-500/30'
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            'p-2 rounded-lg',
            variant === 'default' && 'bg-muted',
            variant === 'primary' && 'bg-primary/20',
            variant === 'success' && 'bg-green-500/20',
            variant === 'warning' && 'bg-amber-500/20'
          )}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">
            {toBanglaNumber(value)}{suffix && <span className="text-base font-normal text-muted-foreground"> {suffix}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
