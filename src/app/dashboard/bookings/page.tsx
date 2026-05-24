import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import BookingsClient from './bookings-client';

export const metadata = {
  title: 'My Bookings History - MindOrbit',
  description: 'Track your consultation bookings, cancellation status, refund logs, and leave specialist feedback.',
};

export default async function PatientBookingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  let bookings: any[] = [];
  try {
    // 1. Fetch bookings
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
      .order('scheduled_time', { ascending: false });

    // 2. Fetch reviews to match
    const { data: dbReviews } = await adminDb
      .from('reviews')
      .select('booking_id')
      .eq('patient_id', clerkUser.id);

    const reviewBookingIds = new Set(dbReviews?.map((r) => r.booking_id) || []);

    if (!fetchErr && dbBookings && dbBookings.length > 0) {
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
        hasReview: reviewBookingIds.has(b.id),
      }));
    }
  } catch (err) {
    console.error('Error fetching patient bookings history:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          My Consultation Bookings
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review details of upcoming sessions, cancel scheduled appointments, or write psychiatrist reviews.
        </p>
      </div>

      <BookingsClient bookings={bookings} />
    </div>
  );
}
