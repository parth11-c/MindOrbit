import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { LayoutDashboard, Calendar, FileText, ClipboardList, Wallet, Sparkles, ShieldCheck, AlertCircle, Video, Settings } from 'lucide-react';
import PsychiatristOnboardingWizard from '@/components/psychiatrist/onboarding-wizard';
import { sandboxVerifyClinicianAction } from '@/actions/psychiatrist';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard Overview', href: '/psychiatrist', icon: LayoutDashboard },
  { name: 'Live Sessions', href: '/psychiatrist/sessions', icon: Video },
  { name: 'Onboarding & Profile', href: '/psychiatrist/profile', icon: FileText },
  { name: 'Availability Calendar', href: '/psychiatrist/availability', icon: Calendar },
  { name: 'Appointments Manager', href: '/psychiatrist/appointments', icon: ClipboardList },
  { name: 'Earnings & Payouts', href: '/psychiatrist/earnings', icon: Wallet },
  { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
];

export default async function PsychiatristLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const supabase = createAdminClient();
  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  if (!dbUser) {
    redirect('/');
  }

  if (dbUser.role !== 'psychiatrist') {
    redirect('/'); // patient or other roles shouldn't access this panel
  }

  // Fetch psychiatrist specific credentials
  const { data: doctor } = await supabase
    .from('psychiatrists')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  const status = doctor?.verification_status || 'pending';

  // Fetch verification documents count
  const { count: docCount } = await supabase
    .from('psychiatrist_documents')
    .select('id', { count: 'exact', head: true })
    .eq('psychiatrist_id', clerkUser.id);

  // A doctor has completed onboarding once they have chosen a specialization and uploaded verification documents.
  const onboardingIncomplete = !doctor?.specialization_id || !docCount || docCount === 0;

  if (onboardingIncomplete) {
    // Fetch specializations list for selection dropdown
    let { data: specializations } = await supabase
      .from('specializations')
      .select('id, name')
      .order('name');

    if (!specializations || specializations.length === 0) {
      const defaultSpecs = [
        { name: 'Clinical Psychiatry', description: 'Diagnosis, treatment and prevention of mental, emotional and behavioral disorders.' },
        { name: 'Child & Adolescent Psychiatry', description: 'Specialized mental healthcare for children, teenagers and their families.' },
        { name: 'Addiction Psychiatry', description: 'Support and clinical therapy for individuals struggling with substance abuse and behavioral addictions.' },
        { name: 'Geriatric Psychiatry', description: 'Mental healthcare addressing cognitive disorders and mental health issues in older adults.' },
        { name: 'Forensic Psychiatry', description: 'Intersection of mental health and the law, including expert evaluation and legal testimony.' }
      ];
      await supabase.from('specializations').insert(defaultSpecs);

      const { data: refetched } = await supabase
        .from('specializations')
        .select('id, name')
        .order('name');
      specializations = refetched;
    }

    return (
      <PsychiatristOnboardingWizard
        specializations={specializations || []}
        initialUser={{
          firstName: dbUser.first_name || '',
          lastName: dbUser.last_name || '',
          avatarUrl: dbUser.avatar_url || '',
          email: dbUser.email || '',
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950 flex flex-col md:flex-row">
      {/* Left Navigation Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-sidebar dark:bg-neutral-900 border-r border-sidebar-border dark:border-neutral-800 flex flex-col justify-between text-neutral-700 dark:text-neutral-300">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-500 mb-8 px-2">
            <Sparkles className="w-5 h-5 text-red-800 fill-red-200 dark:text-red-500 dark:fill-neutral-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white">Clinician Control</span>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
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

        {/* Small branding or settings entry at sidebar foot */}
        <div className="p-6 border-t border-sidebar-border dark:border-neutral-800 bg-[#EBD8C9]/10 dark:bg-neutral-950/20">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">MindOrbit clinical panel</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        {/* Verification Alert Banner */}
        {status === 'pending' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-amber-700 dark:text-amber-400 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Your clinician credentials verification is pending approval. You will not be visible on the public discovery page until verified.</span>
            </div>
            {process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true' && (
              <form action={async () => { await sandboxVerifyClinicianAction(); }}>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  Verify Instantly (Sandbox)
                </button>
              </form>
            )}
          </div>
        )}
        {status === 'rejected' && (
          <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-red-700 dark:text-red-400 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-800 flex-shrink-0" />
              <span>Verification rejected. Please review uploaded certificates and resubmit details.</span>
            </div>
            {process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true' && (
              <form action={async () => { await sandboxVerifyClinicianAction(); }}>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-sm hover:shadow"
                >
                  Verify Instantly (Sandbox)
                </button>
              </form>
            )}
          </div>
        )}
        {status === 'verified' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 px-6 py-3 flex items-center space-x-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Account Verified. Your profile is live in the search directory.</span>
          </div>
        )}

        <div className="p-6 md:p-8 flex-grow">
          {children}
        </div>
      </main>
    </div>
  );
}
