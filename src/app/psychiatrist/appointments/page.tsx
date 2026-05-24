import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import AppointmentsClient from './appointments-client';

export const metadata = {
  title: 'Consultation Appointments Manager - MindOrbit',
  description: 'Approve, reschedule, complete, or decline patient psychiatric consultations.',
};

export default async function PsychiatristAppointmentsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // Fetch all bookings for this psychiatrist
  const { data: bookings, error: bookingsErr } = await adminDb
    .from('bookings')
    .select(`
      id,
      scheduled_time,
      status,
      payment_status,
      amount,
      patient_id,
      approval_status,
      users!bookings_patient_id_fkey (
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('psychiatrist_id', clerkUser.id)
    .order('scheduled_time', { ascending: false });

  const formattedBookings = (bookings || []).map((b: any) => {
    const userRecord = Array.isArray(b.users) ? b.users[0] : b.users;
    return {
      id: b.id,
      scheduled_time: b.scheduled_time,
      status: b.status,
      payment_status: b.payment_status,
      amount: Number(b.amount),
      patient_id: b.patient_id,
      approval_status: b.approval_status,
      users: userRecord || null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Appointments Manager</h1>
        <p className="text-xs text-neutral-400 mt-1">Review upcoming consultations, approve slots, or mark appointments completed.</p>
      </div>

      <AppointmentsClient initialBookings={formattedBookings} psychiatristId={clerkUser.id} />
    </div>
  );
}
