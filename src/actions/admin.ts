'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to verify if user is an admin
async function verifyAdminAccess(adminDb: any, userId: string) {
  const { data: dbUser } = await adminDb
    .from('users')
    .select('role, is_suspended')
    .eq('id', userId)
    .single();

  if (!dbUser || dbUser.role !== 'admin' || dbUser.is_suspended) {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return true;
}

export async function updatePsychiatristVerification(
  psychiatristId: string,
  status: 'verified' | 'rejected'
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    // Update psychiatrist verification status
    const { error: updateErr } = await adminDb
      .from('psychiatrists')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', psychiatristId);

    if (updateErr) throw updateErr;

    // Log admin action
    await adminDb.from('admin_logs').insert({
      admin_id: user.id,
      action: `PSYCHIATRIST_${status.toUpperCase()}`,
      details: `Psychiatrist ID ${psychiatristId} verification set to ${status}.`,
    });

    // Notify psychiatrist
    await adminDb.from('notifications').insert({
      user_id: psychiatristId,
      title: `Profile Verification: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      content: status === 'verified'
        ? 'Congratulations! Your profile has been verified by the administrator. You can now define your availability slots and start receiving bookings.'
        : 'Unfortunately, your credential document submissions were rejected. Please update your onboarding profile with valid certificates and resubmit.',
    });

    revalidatePath('/admin/psychiatrists');
    revalidatePath(`/psychiatrists/${psychiatristId}`);
    return { success: true };
  } catch (error: any) {
    console.error('updatePsychiatristVerification failed:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    // Prevent suspending self
    if (userId === user.id) {
      return { success: false, error: 'Administrators cannot suspend their own account' };
    }

    const { error: updateErr } = await adminDb
      .from('users')
      .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Log admin action
    await adminDb.from('admin_logs').insert({
      admin_id: user.id,
      action: isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
      details: `User ID ${userId} is_suspended flag set to ${isSuspended}.`,
    });

    // Notify user (even if suspended, they can see this when checking state)
    await adminDb.from('notifications').insert({
      user_id: userId,
      title: isSuspended ? 'Account Suspended' : 'Account Reinstated',
      content: isSuspended
        ? 'Your account has been suspended by the platform administrator due to a violation of our terms. Please contact support if you believe this is an error.'
        : 'Your account has been reactivated. You can resume scheduling consultations or managing your slots.',
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin/psychiatrists');
    revalidatePath(`/psychiatrists/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('toggleUserSuspension failed:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSystemSettings(data: {
  commissionPercent: number;
  supportEmail: string;
  announcement: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    if (data.commissionPercent < 0 || data.commissionPercent > 100) {
      return { success: false, error: 'Commission percentage must be between 0 and 100' };
    }

    // Update settings in system_settings table
    const settings = [
      { key: 'platform_commission_percent', value: String(data.commissionPercent) },
      { key: 'support_email', value: data.supportEmail },
      { key: 'announcement', value: data.announcement },
    ];

    for (const s of settings) {
      const { error } = await adminDb
        .from('system_settings')
        .upsert({ key: s.key, value: s.value, updated_at: new Date().toISOString() });

      if (error) throw error;
    }

    // Log action
    await adminDb.from('admin_logs').insert({
      admin_id: user.id,
      action: 'SYSTEM_SETTINGS_UPDATE',
      details: `Commission set to ${data.commissionPercent}%, support email set to ${data.supportEmail}.`,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('updateSystemSettings failed:', error);
    return { success: false, error: error.message };
  }
}

export async function moderateReview(reviewId: string, action: 'keep' | 'flag' | 'delete') {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    if (action === 'delete') {
      // Get psychiatrist id from review before deleting to revalidate doctor page
      const { data: review } = await adminDb
        .from('reviews')
        .select('psychiatrist_id')
        .eq('id', reviewId)
        .single();

      const { error: delErr } = await adminDb
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (delErr) throw delErr;

      // Log action
      await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: 'REVIEW_DELETE',
        details: `Deleted review ID ${reviewId}.`,
      });

      if (review?.psychiatrist_id) {
        revalidatePath(`/psychiatrists/${review.psychiatrist_id}`);
      }
    } else {
      // Toggle flagging
      const isFlagged = action === 'flag';
      const { data: review, error: flagErr } = await adminDb
        .from('reviews')
        .update({ is_flagged: isFlagged })
        .eq('id', reviewId)
        .select('psychiatrist_id')
        .single();

      if (flagErr) throw flagErr;

      // Log action
      await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: isFlagged ? 'REVIEW_FLAG' : 'REVIEW_UNFLAG',
        details: `Set is_flagged = ${isFlagged} on review ID ${reviewId}.`,
      });

      if (review?.psychiatrist_id) {
        revalidatePath(`/psychiatrists/${review.psychiatrist_id}`);
      }
    }

    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error: any) {
    console.error('moderateReview failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createSpecialization(name: string, description: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    const { error } = await adminDb
      .from('specializations')
      .insert({ name, description });

    if (error) throw error;

    await adminDb.from('admin_logs').insert({
      admin_id: user.id,
      action: 'SPECIALIZATION_CREATE',
      details: `Created new specialization: ${name}`,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/psychiatrists');
    return { success: true };
  } catch (error: any) {
    console.error('createSpecialization failed:', error);
    return { success: false, error: error.message };
  }
}

export async function adminInterveneBooking(
  bookingId: string,
  actionType: 'cancel_refund' | 'complete'
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    await verifyAdminAccess(adminDb, user.id);

    // Fetch booking details
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    if (actionType === 'complete') {
      const needToCredit = booking.approval_status === 'pending' && booking.payment_status === 'paid';
      
      const { error } = await adminDb
        .from('bookings')
        .update({
          status: 'completed',
          approval_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      if (needToCredit) {
        const creditedAmount = Number((booking.amount - booking.commission_amount).toFixed(2));
        const { data: doc } = await adminDb
          .from('psychiatrists')
          .select('earnings, total_sessions')
          .eq('id', booking.psychiatrist_id)
          .single();

        if (doc) {
          const newEarnings = Number(doc.earnings) + creditedAmount;
          const newSessions = Number(doc.total_sessions) + 1;
          await adminDb
            .from('psychiatrists')
            .update({
              earnings: newEarnings,
              total_sessions: newSessions,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.psychiatrist_id);
        }
      }

      // Log admin action
      await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: 'BOOKING_FORCE_COMPLETE',
        details: `Booking ID ${bookingId} marked completed by admin.`,
      });

      // Notify patient and doctor
      await adminDb.from('notifications').insert([
        {
          user_id: booking.patient_id,
          title: 'Session Marked Completed',
          content: 'An administrator has marked your session as completed.',
        },
        {
          user_id: booking.psychiatrist_id,
          title: 'Session Marked Completed',
          content: 'An administrator has marked your session as completed.',
        }
      ]);
    } else if (actionType === 'cancel_refund') {
      const { error } = await adminDb
        .from('bookings')
        .update({
          status: 'cancelled',
          approval_status: 'rejected',
          payment_status: booking.payment_status === 'paid' ? 'refunded' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Release slot
      if (booking.slot_id) {
        await adminDb
          .from('availability_slots')
          .update({ is_booked: false })
          .eq('id', booking.slot_id);
      }

      // If already paid and WAS approved, adjust psychiatrist metrics (earnings/sessions)
      if (booking.payment_status === 'paid' && booking.approval_status === 'approved') {
        const creditedAmount = Number((booking.amount - booking.commission_amount).toFixed(2));
        const { data: doc } = await adminDb
          .from('psychiatrists')
          .select('earnings, total_sessions')
          .eq('id', booking.psychiatrist_id)
          .single();

        if (doc) {
          const newEarnings = Math.max(0, Number(doc.earnings) - creditedAmount);
          const newSessions = Math.max(0, Number(doc.total_sessions) - 1);
          await adminDb
            .from('psychiatrists')
            .update({
              earnings: newEarnings,
              total_sessions: newSessions,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.psychiatrist_id);
        }
      }

      // Log admin action
      await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: 'BOOKING_FORCE_CANCEL_REFUND',
        details: `Booking ID ${bookingId} cancelled and refunded by admin.`,
      });

      // Notify patient and doctor
      await adminDb.from('notifications').insert([
        {
          user_id: booking.patient_id,
          title: 'Session Cancelled & Refunded',
          content: 'An administrator has cancelled your booking and initiated a refund.',
        },
        {
          user_id: booking.psychiatrist_id,
          title: 'Session Cancelled by Admin',
          content: `The booking scheduled for ${new Date(booking.scheduled_time).toLocaleString()} has been cancelled by an administrator.`,
        }
      ]);
    }

    revalidatePath('/admin/bookings');
    return { success: true };
  } catch (error: any) {
    console.error('adminInterveneBooking failed:', error);
    return { success: false, error: error.message };
  }
}

