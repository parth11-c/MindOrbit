'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markBookingCompleted(bookingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // Fetch booking details
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    // Verify authorized user: must be the booking psychiatrist or admin
    if (booking.psychiatrist_id !== user.id) {
      // Check if user is admin
      const { data: dbUser } = await adminDb
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (dbUser?.role !== 'admin') {
        return { success: false, error: 'Unauthorized to mark session completed' };
      }
    }

    // Update status
    const { error } = await adminDb
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Send notification to patient to leave a review
    await adminDb.from('notifications').insert({
      user_id: booking.patient_id,
      title: 'Consultation Completed',
      content: `Your session with the psychiatrist is complete. Please share your feedback and leave a review.`,
    });

    revalidatePath('/psychiatrist/appointments');
    revalidatePath('/dashboard');
    revalidatePath(`/psychiatrists/${booking.psychiatrist_id}`);

    return { success: true };
  } catch (error: any) {
    console.error('markBookingCompleted failed:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelBookingByPatient(bookingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // Fetch booking details
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    // Security check: must be patient owner
    if (booking.patient_id !== user.id) {
      return { success: false, error: 'Unauthorized booking owner' };
    }

    // Business rule: Cannot cancel slots starting within 4 hours
    const now = new Date();
    const scheduledTime = new Date(booking.scheduled_time);
    const timeDiffMins = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

    if (timeDiffMins < 240) {
      return { success: false, error: 'Sessions cannot be cancelled within 4 hours of the scheduled time.' };
    }

    // Cancel appointment and refund
    const { error } = await adminDb
      .from('bookings')
      .update({
        status: 'cancelled',
        payment_status: booking.payment_status === 'paid' ? 'refunded' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Release availability slot
    if (booking.slot_id) {
      await adminDb
        .from('availability_slots')
        .update({ is_booked: false })
        .eq('id', booking.slot_id);
    }

    // Subtract psychiatrist metrics (session counter & earnings)
    const creditedAmount = Number((booking.amount - booking.commission_amount).toFixed(2));
    const { data: doc } = await adminDb
      .from('psychiatrists')
      .select('earnings, total_sessions')
      .eq('id', booking.psychiatrist_id)
      .single();

    if (doc && booking.payment_status === 'paid' && booking.approval_status === 'approved') {
      const newEarnings = Math.max(0, Number(doc.earnings) - creditedAmount);
      const newSessions = Math.max(0, Number(doc.total_sessions) - 1);
      
      await adminDb
        .from('psychiatrists')
        .update({
          earnings: newEarnings,
          total_sessions: newSessions,
        })
        .eq('id', booking.psychiatrist_id);
    }

    // Notify doctor
    await adminDb.from('notifications').insert({
      user_id: booking.psychiatrist_id,
      title: 'Session Cancelled by Patient',
      content: `The consultation scheduled for ${scheduledTime.toLocaleString()} has been cancelled by the patient. The slot has been freed up.`,
    });

    revalidatePath('/dashboard');
    revalidatePath('/psychiatrist/appointments');

    return { success: true };
  } catch (error: any) {
    console.error('cancelBookingByPatient failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getBookingStatus(bookingId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminDb = createAdminClient();
    const { data: booking, error } = await adminDb
      .from('bookings')
      .select('status, approval_status')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    return {
      success: true,
      status: booking.status,
      approval_status: booking.approval_status,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getPatientActiveBookings() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminDb = createAdminClient();
    const { data: dbBookings, error } = await adminDb
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
      .eq('patient_id', user.id)
      .in('status', ['booked', 'pending_payment'])
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    const formatted = (dbBookings || []).map((b: any) => ({
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

    return { success: true, bookings: formatted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getDoctorActiveBookings() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminDb = createAdminClient();
    const { data: dbBookings, error } = await adminDb
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
      .eq('psychiatrist_id', user.id)
      .eq('status', 'booked')
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    const formatted = (dbBookings || []).map((b: any) => {
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

    return { success: true, bookings: formatted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
