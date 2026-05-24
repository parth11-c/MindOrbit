import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import AvailabilityClient from './availability-client';

export const metadata = {
  title: 'Manage Availability Calendar - MindOrbit',
  description: 'Add or remove consultation session slots for patients to schedule consultations online.',
};

export default async function PsychiatristAvailabilityPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // 1. Fetch verification status
  const { data: doctor } = await adminDb
    .from('psychiatrists')
    .select('verification_status')
    .eq('id', clerkUser.id)
    .single();

  const isVerified = doctor?.verification_status === 'verified';

  // 2. Fetch slots (all slots starting from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: slots, error: slotsErr } = await adminDb
    .from('availability_slots')
    .select('id, start_time, end_time, is_booked')
    .eq('psychiatrist_id', clerkUser.id)
    .gte('start_time', today.toISOString())
    .order('start_time');

  if (slotsErr) {
    console.error('Error fetching availability slots:', slotsErr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Availability Calendar Manager</h1>
        <p className="text-xs text-neutral-400 mt-1">Generate booking timeslots and review upcoming schedules.</p>
      </div>

      <AvailabilityClient
        initialSlots={slots || []}
        isVerified={isVerified}
      />
    </div>
  );
}
