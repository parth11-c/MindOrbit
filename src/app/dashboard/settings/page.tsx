import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';

export const metadata = {
  title: 'Profile Settings - MindOrbit',
  description: 'Manage your patient details, sign out of your account, or toggle developer role switches.',
};

export default async function PatientSettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // Fetch current user details from Supabase to check role
  const { data: dbUser, error } = await adminDb
    .from('users')
    .select('role')
    .eq('id', clerkUser.id)
    .single();

  const role = dbUser?.role || 'patient';
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
  const first = clerkUser.firstName || '';
  const last = clerkUser.lastName || '';
  const avatar = clerkUser.imageUrl || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review your Clerk profile details or change your dashboard access role for testing.
        </p>
      </div>

      <SettingsClient
        userId={clerkUser.id}
        email={email}
        firstName={first}
        lastName={last}
        avatarUrl={avatar}
        currentRole={role}
      />
    </div>
  );
}
