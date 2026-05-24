import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import ThemeToggle from './theme-toggle';
import { Bell } from 'lucide-react';

export default async function Navbar() {
  const clerkUser = await currentUser();
  let dbUser = null;
  let pendingCount = 0;

  if (clerkUser) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUser.id)
      .single();
    dbUser = data;

    if (dbUser) {
      if (dbUser.role === 'psychiatrist') {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('psychiatrist_id', clerkUser.id)
          .eq('status', 'booked')
          .eq('approval_status', 'pending');
        pendingCount = count || 0;
      } else if (dbUser.role === 'patient') {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', clerkUser.id)
          .eq('status', 'booked')
          .eq('approval_status', 'approved');
        pendingCount = count || 0;
      }
    }
  }

  const role = dbUser?.role || 'patient';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md dark:border-neutral-900/60 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 text-lg font-bold tracking-tight text-neutral-950 dark:text-white group">
            <span className="w-6.5 h-6.5 rounded-full bg-red-600 text-neutral-900 dark:text-neutral-950 flex items-center justify-center text-[10px] font-extrabold tracking-widest transition-transform group-hover:rotate-12 shadow-sm shadow-red-500/20">
              M
            </span>
            <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Mind<span className="text-red-800 font-normal">Orbit</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <Link href="/psychiatrists" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">Browse Doctors</Link>
            <Link href="/about" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">About Us</Link>
            <Link href="/pricing" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">Pricing</Link>
            <Link href="/contact" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">Contact</Link>
          </nav>
        </div>

        {/* Auth status / actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {clerkUser ? (
            <>
              {/* Dashboard redirects depending on roles */}
              <nav className="flex items-center gap-3 mr-1">
                {role === 'admin' && (
                  <Link href="/admin" className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                    Admin Portal
                  </Link>
                )}
                {role === 'psychiatrist' && (
                  <div className="flex items-center gap-2">
                    <Link href="/psychiatrist" className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      Doctor Panel
                    </Link>
                    {pendingCount > 0 && (
                      <Link href="/psychiatrist/sessions" className="relative flex items-center justify-center w-8 h-8 rounded-full border border-red-200 bg-red-50 text-red-750 hover:bg-red-100 transition-all cursor-pointer" title="Pending consultation requests">
                        <Bell className="w-4 h-4 text-red-700 animate-bounce" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-650 text-[9px] font-extrabold text-neutral-900 dark:text-neutral-950 shadow-sm animate-pulse">
                          {pendingCount}
                        </span>
                      </Link>
                    )}
                  </div>
                )}
                {role === 'patient' && (
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                      My Account
                    </Link>
                    {pendingCount > 0 && (
                      <Link href="/dashboard/sessions" className="relative flex items-center justify-center w-8 h-8 rounded-full border border-emerald-250 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 transition-all cursor-pointer animate-pulse" title="Approved live sessions ready to join">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-extrabold text-white shadow-sm">
                          {pendingCount}
                        </span>
                      </Link>
                    )}
                  </div>
                )}
              </nav>
              <UserButton />
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-xs font-semibold hover:text-red-600 transition-colors text-neutral-600 dark:text-neutral-300">
                Log In
              </Link>
              <Link href="/sign-up" className="bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow hover-lift">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
