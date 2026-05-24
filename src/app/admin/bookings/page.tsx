import { createAdminClient } from '@/lib/supabase/server';
import BookingsClient, { BookingAdminDetail } from './bookings-client';

export const metadata = {
  title: 'Consultations & Reservation Ledger - MindOrbit Admin',
  description: 'Track all psychiatric session transactions, manage payments, and intervene in disputes.',
};

export default async function AdminBookingsPage() {
  const adminDb = createAdminClient();

  let bookings: BookingAdminDetail[] = [];
  try {
    // 1. Fetch bookings
    const { data: dbBookings, error: bookingsErr } = await adminDb
      .from('bookings')
      .select('id, patient_id, psychiatrist_id, scheduled_time, amount, commission_amount, razorpay_order_id, razorpay_payment_id, status, payment_status, approval_status, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch users to map patient & doctor metadata
    const { data: dbUsers, error: usersErr } = await adminDb
      .from('users')
      .select('id, first_name, last_name, email, avatar_url');

    if (!bookingsErr && dbBookings && dbUsers) {
      const usersMap = new Map(dbUsers.map((u) => [u.id, u]));

      bookings = dbBookings.map((b: any) => {
        const patient: any = usersMap.get(b.patient_id) || {};
        const doctor: any = usersMap.get(b.psychiatrist_id) || {};

        return {
          id: b.id,
          patient_id: b.patient_id,
          patientName: `${patient.first_name || 'Anonymous'} ${patient.last_name || ''}`.trim(),
          patientEmail: patient.email || 'unknown@user.com',
          patientAvatar: patient.avatar_url,
          psychiatrist_id: b.psychiatrist_id,
          doctorName: `${doctor.first_name || 'Clinician'} ${doctor.last_name || ''}`.trim(),
          doctorEmail: doctor.email || 'unknown@doctor.com',
          scheduled_time: b.scheduled_time,
          amount: Number(b.amount),
          commission_amount: Number(b.commission_amount),
          razorpay_order_id: b.razorpay_order_id,
          razorpay_payment_id: b.razorpay_payment_id,
          status: b.status,
          payment_status: b.payment_status,
          approval_status: b.approval_status || 'pending',
          created_at: b.created_at,
        };
      });
    } else if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
      bookings = [
        {
          id: 'b1',
          patient_id: 'user1',
          patientName: 'Jane Doe',
          patientEmail: 'jane.doe@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          psychiatrist_id: 'doc1',
          doctorName: 'Sarah Jenkins',
          doctorEmail: 'sarah.jenkins@mindorbit.com',
          scheduled_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 1500,
          commission_amount: 225,
          razorpay_order_id: 'order_12345abc',
          razorpay_payment_id: 'pay_12345abc',
          status: 'completed',
          payment_status: 'paid',
          approval_status: 'approved',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'b2',
          patient_id: 'user1',
          patientName: 'Jane Doe',
          patientEmail: 'jane.doe@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          psychiatrist_id: 'doc2',
          doctorName: 'Amit Patel',
          doctorEmail: 'amit.patel@mindorbit.com',
          scheduled_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 1800,
          commission_amount: 270,
          razorpay_order_id: 'order_67890def',
          razorpay_payment_id: 'pay_67890def',
          status: 'booked',
          payment_status: 'paid',
          approval_status: 'pending',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'b3',
          patient_id: 'user2',
          patientName: 'Mark Robinson',
          patientEmail: 'mark.robinson@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
          psychiatrist_id: 'doc3',
          doctorName: 'Elena Rostova',
          doctorEmail: 'elena.rostova@mindorbit.com',
          scheduled_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 2200,
          commission_amount: 330,
          razorpay_order_id: 'order_11223ghi',
          razorpay_payment_id: 'pay_11223ghi',
          status: 'completed',
          payment_status: 'paid',
          approval_status: 'approved',
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
    }
  } catch (err) {
    console.error('Error fetching admin bookings ledger:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Reservation & Payment Ledger
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor session statuses, payouts, commission splits, and execute administrative adjustments.
        </p>
      </div>

      <BookingsClient bookings={bookings} />
    </div>
  );
}
