import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/dashboard-client';

export const metadata = {
  title: 'Patient Dashboard - MindOrbit',
  description: 'Manage your mental health sessions, upcoming consultations, and in-app alerts.',
};

export default async function PatientDashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // 1. Fetch upcoming bookings
  let upcomingBookings: any[] = [];
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
      .eq('status', 'booked')
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true });

    if (!fetchErr && dbBookings && dbBookings.length > 0) {
      upcomingBookings = dbBookings.map((b: any) => ({
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
    console.error('Error querying patient bookings:', err);
  }

  // 2. Fetch notifications
  let notifications: any[] = [];
  try {
    const { data: dbNotifs, error: notifErr } = await adminDb
      .from('notifications')
      .select('*')
      .eq('user_id', clerkUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!notifErr && dbNotifs && dbNotifs.length > 0) {
      notifications = dbNotifs;
    } else {
      // Default notices for new profile
      notifications = [
        {
          id: 'notif-welcome',
          title: 'Welcome to MindOrbit!',
          content: 'You can discover verified psychiatrists, schedule online therapy appointments, and manage consultations.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];
    }
  } catch (err) {
    console.error('Error querying patient notifications:', err);
  }

  const first = clerkUser.firstName || '';
  const last = clerkUser.lastName || '';
  const fullName = first || last ? `${first} ${last}`.trim() : 'Patient';

  return (
    <DashboardClient
      upcomingBookings={upcomingBookings}
      notifications={notifications}
      userName={fullName}
    />
  );
}
