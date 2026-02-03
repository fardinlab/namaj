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
  Moon,
  Code
} from 'lucide-react';
import { AppNavLink } from './AppNavLink';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
  { to: '/members', icon: Users, label: 'সদস্য তালিকা' },
  { to: '/leaderboard', icon: Trophy, label: 'লিডারবোর্ড' },
  { to: '/campaign', icon: Info, label: 'ক্যাম্পেইনের তথ্য' },
  { to: '/settings', icon: Settings, label: 'সেটিংস' },
  { to: '/about-developer', icon: Code, label: 'About Developer' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-sidebar flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
              <Moon className="h-6 w-6 text-sidebar-primary" />
              <span>নামাজ ক্যাম্পেইন</span>
            </h1>
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
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <AppNavLink key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </AppNavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 text-center">
            © ২০২৬ মসজিদ ক্যাম্পেইন
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-background border-b border-border lg:hidden">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-foreground">নামাজ উপস্থিতি ক্যাম্পেইন</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
