'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitReview(data: {
  bookingId: string;
  rating: number;
  comment: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    const adminDb = createAdminClient();

    // Verify booking details
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', data.bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    if (booking.patient_id !== user.id) {
      return { success: false, error: 'Unauthorized to review this session' };
    }

    if (booking.status !== 'completed') {
      return { success: false, error: 'Reviews can only be submitted for completed sessions' };
    }

    // Insert review
    const { error: insertErr } = await adminDb
      .from('reviews')
      .insert({
        booking_id: data.bookingId,
        patient_id: user.id,
        psychiatrist_id: booking.psychiatrist_id,
        rating: data.rating,
        comment: data.comment,
        is_flagged: false,
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return { success: false, error: 'You have already submitted a review for this session.' };
      }
      throw insertErr;
    }

    // Trigger path revalidation to update UI states
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookings');
    revalidatePath(`/psychiatrists/${booking.psychiatrist_id}`);

    return { success: true };
  } catch (error: any) {
    console.error('submitReview failed:', error);
    return { success: false, error: error.message };
  }
}
