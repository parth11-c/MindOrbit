import { createAdminClient } from '@/lib/supabase/server';
import UsersClient from './users-client';

export const metadata = {
  title: 'User Management - MindOrbit Admin',
  description: 'View all users, inspect session history, and manage account suspensions.',
};

export default async function AdminUsersPage() {
  const adminDb = createAdminClient();

  let users: any[] = [];
  try {
    // 1. Fetch all users
    const { data: dbUsers, error: usersErr } = await adminDb
      .from('users')
      .select('id, email, first_name, last_name, avatar_url, role, is_suspended, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch all bookings with doctor names
    const { data: dbBookings, error: bookingsErr } = await adminDb
      .from('bookings')
      .select(`
        id,
        patient_id,
        scheduled_time,
        amount,
        status,
        psychiatrists (
          users (
            first_name,
            last_name
          )
        )
      `);

    if (!usersErr && dbUsers) {
      // Map bookings to their patient
      const bookingsByPatient: { [key: string]: any[] } = {};
      dbBookings?.forEach((b: any) => {
        if (!bookingsByPatient[b.patient_id]) {
          bookingsByPatient[b.patient_id] = [];
        }
        
        // Resolve doctor name from nested relation
        const docUser = b.psychiatrists?.users;
        const doctorName = docUser 
          ? `${docUser.first_name || ''} ${docUser.last_name || ''}`.trim()
          : 'Unknown Practitioner';

        bookingsByPatient[b.patient_id].push({
          id: b.id,
          scheduled_time: b.scheduled_time,
          amount: Number(b.amount),
          status: b.status,
          doctorName,
        });
      });

      users = dbUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        avatar_url: u.avatar_url,
        role: u.role,
        is_suspended: u.is_suspended,
        created_at: u.created_at,
        bookings: bookingsByPatient[u.id] || [],
      }));
    }
  } catch (err) {
    console.error('Error fetching admin users listings:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          User Directory
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Inspect patient consultation histories, view user account roles, and manage suspensions.
        </p>
      </div>

      <UsersClient users={users} />
    </div>
  );
}
