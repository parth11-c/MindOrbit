import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import SessionsClient from './sessions-client';

export const metadata = {
  title: 'Consultation Sessions - Clinician - MindOrbit',
  description: 'View active consult requests, accept instant connections, and join live video sessions.',
};

export default async function PsychiatristSessionsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  let bookings: any[] = [];
  try {
    const { data: dbBookings, error: fetchErr } = await adminDb
      .from('bookings')
      .select(`
        id,
        scheduled_time,
        amount,
        status,
        payment_status,
        approval_status,
        patient_id,
        users!bookings_patient_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('psychiatrist_id', clerkUser.id)
      .eq('status', 'booked')
      .order('scheduled_time', { ascending: true });

    if (!fetchErr && dbBookings) {
      bookings = dbBookings.map((b: any) => {
        const userRecord = Array.isArray(b.users) ? b.users[0] : b.users;
        return {
          id: b.id,
          scheduled_time: b.scheduled_time,
          amount: Number(b.amount),
          status: b.status,
          payment_status: b.payment_status,
          approval_status: b.approval_status,
          patient_id: b.patient_id,
          users: userRecord || null,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching doctor live sessions:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Live Session & Approval Manager
        </h1>
        <p className="text-xs text-neutral-450 mt-1">
          Review instant consult requests in real-time, accept to establish direct video chat, and join active rooms.
        </p>
      </div>

      <SessionsClient initialBookings={bookings} psychiatristId={clerkUser.id} />
    </div>
  );
}
