import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Info, 
  Settings,
  Menu,
  X,
  Code,
  CalendarDays
} from 'lucide-react';
import { AppNavLink } from './AppNavLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
  { to: '/members', icon: Users, label: 'সদস্য তালিকা' },
  { to: '/prayer-history', icon: CalendarDays, label: 'নামাজের ইতিহাস' },
  { to: '/leaderboard', icon: Trophy, label: 'অগ্রগামী' },
  { to: '/campaign', icon: Info, label: 'ক্যাম্পেইন' },
  { to: '/settings', icon: Settings, label: 'সেটিংস' },
  { to: '/about-developer', icon: Code, label: 'ডেভেলপার' },
];

// Islamic crescent moon icon
const CrescentMoon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="h-7 w-7"
  >
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
  </svg>
);

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background islamic-pattern">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-sidebar flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'shadow-soft-lg',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header with Crescent */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sidebar-primary">
                <CrescentMoon />
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-sidebar-foreground leading-tight">
                  নামাজ ক্যাম্পেইন
                </h1>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">
                  জামাতে নামাজ উদ্যোগ
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => (
            <AppNavLink key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </AppNavLink>
          ))}
        </nav>

        {/* Footer with Islamic greeting */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-center space-y-1">
            <p className="text-sm font-serif text-sidebar-primary">
              ٱلسَّلَامُ عَلَيْكُمْ
            </p>
            <p className="text-xs text-sidebar-foreground/50">
              © ২০২৬ মসজিদ ক্যাম্পেইন
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border lg:hidden shadow-soft">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-primary">
                <CrescentMoon />
              </div>
              <h1 className="font-serif font-semibold text-foreground">
                নামাজ ক্যাম্পেইন
              </h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 mosque-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
