import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import SessionsClient from '@/app/dashboard/sessions/sessions-client';

export const metadata = {
  title: 'My Live Sessions - MindOrbit',
  description: 'Manage active, ongoing and pending consultation sessions and enter video rooms.',
};

export default async function PatientSessionsPage() {
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
        psychiatrists (
          id,
          specializations (
            name
          ),
          users (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq('patient_id', clerkUser.id)
      .in('status', ['booked', 'pending_payment'])
      .order('scheduled_time', { ascending: true });

    if (!fetchErr && dbBookings) {
      bookings = dbBookings.map((b: any) => ({
        id: b.id,
        scheduled_time: b.scheduled_time,
        amount: Number(b.amount),
        status: b.status,
        payment_status: b.payment_status,
        approval_status: b.approval_status,
        doctor: {
          id: b.psychiatrists?.id || '',
          name: `Dr. ${b.psychiatrists?.users?.first_name || ''} ${b.psychiatrists?.users?.last_name || ''}`,
          specialization: b.psychiatrists?.specializations?.name || 'Psychiatrist',
          avatar_url: b.psychiatrists?.users?.avatar_url,
        },
      }));
    }
  } catch (err) {
    console.error('Error fetching patient live sessions:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          My Live Sessions
        </h1>
        <p className="text-xs text-neutral-450 mt-1">
          Review, enter waiting rooms, or join approved live video sessions in real-time.
        </p>
      </div>

      <SessionsClient initialBookings={bookings} patientId={clerkUser.id} />
    </div>
  );
}
