import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Wallet, Star, Calendar, ClipboardCheck, ArrowRight, UserCheck, Clock, FileCheck } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

export const metadata = {
  title: 'Psychiatrist Clinical Dashboard - MindOrbit',
  description: 'Manage appointments, check consultation earnings, review patient ratings, and configure session schedules.',
};

export default async function PsychiatristDashboardOverview() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // 1. Fetch Psychiatrist clinical stats
  const { data: doctor } = await adminDb
    .from('psychiatrists')
    .select(`
      *,
      users (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('id', clerkUser.id)
    .single();

  if (!doctor) {
    redirect('/psychiatrist/profile'); // onboarding redirect fallback
  }

  // 2. Fetch upcoming bookings (paid and scheduled)
  const { data: upcoming } = await adminDb
    .from('bookings')
    .select(`
      id,
      scheduled_time,
      amount,
      approval_status,
      users!bookings_patient_id_fkey (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('psychiatrist_id', clerkUser.id)
    .eq('status', 'booked')
    .gte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true })
    .limit(3);

  // 3. Fetch latest patient reviews
  const { data: reviews } = await adminDb
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      users (
        first_name,
        last_name
      )
    `)
    .eq('psychiatrist_id', clerkUser.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const formattedUpcoming = (upcoming || []).map((b: any) => {
    const userRecord = Array.isArray(b.users) ? b.users[0] : b.users;
    return {
      ...b,
      users: userRecord || null
    };
  });

  const formattedReviews = (reviews || []).map((r: any) => {
    const userRecord = Array.isArray(r.users) ? r.users[0] : r.users;
    return {
      ...r,
      users: userRecord || null
    };
  });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Welcome back, Dr. {doctor.users?.first_name || ''} {doctor.users?.last_name || ''}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">Check clinical progress, patient charts, and appointment calendars.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Total Revenue</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{formatCurrency(doctor.earnings)}</p>
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Consultations</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{doctor.total_sessions} Completed</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <Star className="w-6 h-6 fill-red-100" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Satisfaction Score</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{doctor.average_rating || '5.0'} / 5.0</p>
          </div>
        </div>

        {/* Status Verification */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Credential Check</p>
            <p className="text-sm font-bold text-neutral-950 dark:text-white mt-1 capitalize">{doctor.verification_status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming appointments list */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-800">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-800" />
              <span>Upcoming Consultations</span>
            </h2>
            <Link
              href="/psychiatrist/appointments"
              className="text-xs font-semibold text-red-800 hover:text-red-750 flex items-center gap-1"
            >
              <span>Manage bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {formattedUpcoming && formattedUpcoming.length > 0 ? (
            <div className="space-y-4">
              {formattedUpcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 p-4 rounded-xl text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-500">
                      {booking.users?.first_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-neutral-800 dark:text-white">
                          {booking.users?.first_name} {booking.users?.last_name}
                        </p>
                        {booking.approval_status === 'pending' ? (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                            Approved
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(booking.scheduled_time)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-neutral-800 dark:text-white">{formatDate(booking.scheduled_time)}</p>
                    <p className="text-[10px] text-red-800 font-bold mt-0.5">{formatCurrency(booking.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-neutral-500">No scheduled sessions. Open slots to receive bookings.</div>
          )}
        </div>

        {/* Latest Patient Reviews */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-800">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-red-800" />
              <span>Latest Reviews</span>
            </h2>
          </div>

          {formattedReviews && formattedReviews.length > 0 ? (
            <div className="space-y-4">
              {formattedReviews.map((rev) => (
                <div key={rev.id} className="border-b last:border-b-0 pb-4 last:pb-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 dark:text-white">
                      {rev.users?.first_name} {rev.users?.last_name?.charAt(0)}.
                    </span>
                    <div className="flex text-amber-500 text-[10px]">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-2 leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-neutral-500">No patient reviews submitted yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
