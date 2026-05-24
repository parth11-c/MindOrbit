import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { Wallet, Star, ClipboardCheck, ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

export const metadata = {
  title: 'Earnings & Patient Reviews - MindOrbit',
  description: 'Track your consultation payouts, platform commission cuts, and read reviews left by your patients.',
};

export default async function PsychiatristEarningsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // 1. Fetch doctor details
  const { data: doctor } = await adminDb
    .from('psychiatrists')
    .select(`
      *,
      users (
        first_name,
        last_name
      )
    `)
    .eq('id', clerkUser.id)
    .single();

  if (!doctor) {
    redirect('/psychiatrist/profile');
  }

  // 2. Fetch completed or paid bookings for transaction logs
  const { data: bookings } = await adminDb
    .from('bookings')
    .select(`
      id,
      scheduled_time,
      amount,
      commission_amount,
      payment_status,
      status,
      users!bookings_patient_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('psychiatrist_id', clerkUser.id)
    .eq('payment_status', 'paid')
    .eq('approval_status', 'approved')
    .order('scheduled_time', { ascending: false });

  // 3. Fetch all reviews
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
    .order('created_at', { ascending: false });

  // Calculate some analytics
  const formattedBookings = (bookings || []).map((b: any) => {
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

  const grossVolume = formattedBookings.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalCommission = formattedBookings.reduce((sum, b) => sum + Number(b.commission_amount), 0);
  const netEarnings = Number(doctor.earnings);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Earnings & Reviews
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor your platform consultation fees, payouts, and detailed patient feedback.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Payouts */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Net Payouts</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{formatCurrency(netEarnings)}</p>
          </div>
        </div>

        {/* Gross Billing */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-200/40 dark:bg-red-950/20 border border-red-300/30 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Gross Billings</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{formatCurrency(grossVolume)}</p>
          </div>
        </div>

        {/* Platform commission */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Platform Fee</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{formatCurrency(totalCommission)}</p>
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-100" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Average Rating</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{doctor.average_rating || '5.0'} / 5.0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payout History / Bookings List */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-6 border-b pb-4 dark:border-neutral-800">
            Consultation Fee Payout Ledger
          </h2>

          {formattedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Patient Name</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3 text-right">Consultation Fee</th>
                    <th className="px-4 py-3 text-right">Platform Fee</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {formattedBookings.map((b) => {
                    const gross = Number(b.amount);
                    const comm = Number(b.commission_amount);
                    const net = gross - comm;
                    return (
                      <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="px-4 py-4 font-bold text-neutral-800 dark:text-white">
                          {b.users?.first_name} {b.users?.last_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>{formatDate(b.scheduled_time)}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{formatTime(b.scheduled_time)}</div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                          {formatCurrency(gross)}
                        </td>
                        <td className="px-4 py-4 text-right text-red-800 font-medium">
                          -{formatCurrency(comm)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-emerald-600">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              No payouts recorded. Unpaid/mock transactions will populate here once bookings are verified.
            </div>
          )}
        </div>

        {/* Detailed Reviews Feed */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-6 border-b pb-4 dark:border-neutral-800">
              Patient Reviews Feed
            </h2>

            {formattedReviews && formattedReviews.length > 0 ? (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                {formattedReviews.map((rev) => (
                  <div key={rev.id} className="border-b last:border-b-0 pb-5 last:pb-0 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-800 dark:text-white">
                        {rev.users?.first_name || 'Patient'} {rev.users?.last_name?.charAt(0) || ''}.
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {formatDate(rev.created_at)}
                      </span>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex text-amber-500 space-x-0.5 text-xs">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < rev.rating ? 'text-amber-500' : 'text-neutral-250 dark:text-neutral-800'}>
                          ★
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic leading-relaxed bg-neutral-50/50 dark:bg-neutral-850 p-2.5 rounded-lg border border-neutral-100/50 dark:border-neutral-800">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-neutral-400">
                No patient reviews submitted yet. Feedback will appear here after patients complete sessions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
