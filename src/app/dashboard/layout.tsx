import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { syncCurrentUser } from '@/actions/sync-user';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  Sparkles, 
  UserCheck, 
  Video,
  FileText,
  Calendar,
  ClipboardList,
  Wallet,
  TrendingUp,
  UserSquare2,
  Users,
  MessageSquareOff,
  Sliders
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  // Run the user synchronization fallback to ensure the user exists in Supabase
  const sync = await syncCurrentUser();
  if (!sync.success) {
    console.error('Failed to auto-sync Clerk profile on dashboard entry:', sync.error);
  }

  const adminDb = createAdminClient();
  const { data: dbUser } = await adminDb
    .from('users')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  if (!dbUser) {
    redirect('/');
  }

  if (dbUser.is_suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-extrabold text-red-800">Account Suspended</h1>
          <p className="text-xs text-muted-foreground">Your account has been suspended by the administrator due to platform rule violations. Please contact support@mindorbit.com to appeal.</p>
          <Link href="/" className="inline-block bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs px-4 py-2.5 rounded-lg transition-colors font-semibold">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Resolve sidebar items and header label dynamically based on role
  let portalTitle = 'Patient Portal';
  let sidebarItems: SidebarItem[] = [
    { name: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Sessions', href: '/dashboard/sessions', icon: Video },
    { name: 'Booking History', href: '/dashboard/bookings', icon: CalendarDays },
    { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (dbUser.role === 'psychiatrist') {
    portalTitle = 'Clinician Control';
    sidebarItems = [
      { name: 'Dashboard Overview', href: '/psychiatrist', icon: LayoutDashboard },
      { name: 'Live Sessions', href: '/psychiatrist/sessions', icon: Video },
      { name: 'Onboarding & Profile', href: '/psychiatrist/profile', icon: FileText },
      { name: 'Availability Calendar', href: '/psychiatrist/availability', icon: Calendar },
      { name: 'Appointments Manager', href: '/psychiatrist/appointments', icon: ClipboardList },
      { name: 'Earnings & Payouts', href: '/psychiatrist/earnings', icon: Wallet },
      { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
    ];
  } else if (dbUser.role === 'admin') {
    portalTitle = 'Admin Center';
    sidebarItems = [
      { name: 'Analytics Board', href: '/admin', icon: TrendingUp },
      { name: 'Psychiatrists Control', href: '/admin/psychiatrists', icon: UserSquare2 },
      { name: 'Users Directory', href: '/admin/users', icon: Users },
      { name: 'Bookings Monitor', href: '/admin/bookings', icon: CalendarDays },
      { name: 'Review Moderation', href: '/admin/reviews', icon: MessageSquareOff },
      { name: 'Platform Settings', href: '/admin/settings', icon: Sliders },
      { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
    ];
  }

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-sidebar dark:bg-neutral-900 border-r border-sidebar-border dark:border-neutral-800 flex flex-col justify-between text-neutral-700 dark:text-neutral-300">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-500 mb-8 px-2">
            <Sparkles className="w-5 h-5 text-red-800 fill-red-200 dark:text-red-500 dark:fill-neutral-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white">{portalTitle}</span>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-[#EBD8C9]/60 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-500" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity Pill */}
        <div className="p-6 border-t border-sidebar-border dark:border-neutral-800 flex items-center space-x-3 text-xs bg-[#EBD8C9]/10 dark:bg-neutral-950/20">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 border border-sidebar-border dark:border-neutral-800 flex-shrink-0">
            <img src={dbUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-neutral-800 dark:text-white truncate max-w-[120px]">
              {dbUser.first_name || 'User'} {dbUser.last_name || ''}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <UserCheck className="w-3 h-3 text-emerald-600" />
              <span className="capitalize">{dbUser.role}</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Content wrapper */}
      <main className="flex-grow p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
