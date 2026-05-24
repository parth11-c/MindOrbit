import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  ShieldCheck, 
  Users, 
  UserSquare2, 
  CalendarDays, 
  MessageSquareOff, 
  Sliders, 
  TrendingUp, 
  Sparkles,
  Settings
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Analytics Board', href: '/admin', icon: TrendingUp },
  { name: 'Psychiatrists Control', href: '/admin/psychiatrists', icon: UserSquare2 },
  { name: 'Users Directory', href: '/admin/users', icon: Users },
  { name: 'Bookings Monitor', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Review Moderation', href: '/admin/reviews', icon: MessageSquareOff },
  { name: 'Platform Settings', href: '/admin/settings', icon: Sliders },
  { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();
  const { data: dbUser } = await adminDb
    .from('users')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  if (!dbUser || dbUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950 flex flex-col md:flex-row animate-fadeIn">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-60 flex-shrink-0 bg-sidebar dark:bg-neutral-900 border-r border-sidebar-border dark:border-neutral-800 flex flex-col justify-between text-neutral-700 dark:text-neutral-300">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-500 mb-8 px-1">
            <Sparkles className="w-4 h-4 text-red-800 fill-red-200 dark:text-red-500 dark:fill-neutral-800" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-800 dark:text-white">Admin Center</span>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-[#EBD8C9]/60 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all"
                >
                  <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-500" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin User Identity */}
        <div className="p-6 border-t border-sidebar-border dark:border-neutral-800 flex items-center space-x-3 text-xs bg-[#EBD8C9]/20 dark:bg-neutral-950/20">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-sidebar-border dark:border-neutral-800">
            <img src={dbUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} alt="Admin Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-extrabold text-neutral-900 dark:text-white truncate max-w-[110px] leading-tight">
              {dbUser.first_name || 'Admin'}
            </p>
            <span className="text-[9px] text-red-800 dark:text-red-500 font-bold flex items-center gap-0.5 mt-0.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-red-800 dark:text-red-500" />
              <span>Full Control</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-grow p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
