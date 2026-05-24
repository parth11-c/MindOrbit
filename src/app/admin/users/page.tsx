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
    } else if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
      // Load standard sandbox clinical & user accounts if DB is empty
      users = [
        {
          id: 'user1',
          email: 'jane.doe@example.com',
          first_name: 'Jane',
          last_name: 'Doe',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          role: 'patient',
          is_suspended: false,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          bookings: [
            {
              id: 'b1',
              scheduled_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              amount: 1500,
              status: 'completed',
              doctorName: 'Sarah Jenkins',
            },
            {
              id: 'b2',
              scheduled_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              amount: 1800,
              status: 'booked',
              doctorName: 'Amit Patel',
            }
          ]
        },
        {
          id: 'user2',
          email: 'mark.robinson@example.com',
          first_name: 'Mark',
          last_name: 'Robinson',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
          role: 'patient',
          is_suspended: false,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          bookings: [
            {
              id: 'b3',
              scheduled_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              amount: 2200,
              status: 'completed',
              doctorName: 'Elena Rostova',
            }
          ]
        },
        {
          id: 'doc1',
          email: 'sarah.jenkins@mindorbit.com',
          first_name: 'Sarah',
          last_name: 'Jenkins',
          avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
          role: 'psychiatrist',
          is_suspended: false,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          bookings: []
        },
        {
          id: 'admin1',
          email: 'admin@mindorbit.com',
          first_name: 'Platform',
          last_name: 'Administrator',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
          role: 'admin',
          is_suspended: false,
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          bookings: []
        }
      ];
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
