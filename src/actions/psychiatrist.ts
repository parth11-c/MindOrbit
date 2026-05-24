'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function savePsychiatristProfile(data: {
  specialization_id: string;
  experience_years: number;
  consultation_fee: number;
  gender: string;
  languages_spoken: string[];
  bio: string;
  education: string;
  document_name?: string;
  document_url?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  customSpecializationName?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // 1. Update user identity details in 'users' table
    if (data.firstName || data.lastName || data.avatarUrl) {
      const { error: userError } = await adminDb
        .from('users')
        .update({
          ...(data.firstName ? { first_name: data.firstName } : {}),
          ...(data.lastName ? { last_name: data.lastName } : {}),
          ...(data.avatarUrl ? { avatar_url: data.avatarUrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (userError) {
        throw new Error(`Failed to update user identity: ${userError.message}`);
      }
    }

    // Resolve specialization_id
    let finalSpecializationId = data.specialization_id;
    if (data.customSpecializationName?.trim()) {
      const { data: existing } = await adminDb
        .from('specializations')
        .select('id')
        .eq('name', data.customSpecializationName.trim())
        .maybeSingle();

      if (existing) {
        finalSpecializationId = existing.id;
      } else {
        const { data: inserted, error: insertErr } = await adminDb
          .from('specializations')
          .insert({
            name: data.customSpecializationName.trim(),
            description: 'Clinician entered custom specialization during profile edit.',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          throw new Error(`Failed to insert custom specialization: ${insertErr?.message}`);
        }
        finalSpecializationId = inserted.id;
      }
    }

    // 2. Update/Upsert profile in 'psychiatrists' table
    const { error: profileError } = await adminDb
      .from('psychiatrists')
      .upsert({
        id: user.id,
        specialization_id: finalSpecializationId || null,
        experience_years: data.experience_years,
        consultation_fee: data.consultation_fee,
        gender: data.gender,
        languages_spoken: data.languages_spoken,
        bio: data.bio,
        education: data.education,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      throw new Error(`Profile save failed: ${profileError.message}`);
    }

    // 2. Add document if provided
    if (data.document_name && data.document_url) {
      const { error: docError } = await adminDb
        .from('psychiatrist_documents')
        .insert({
          psychiatrist_id: user.id,
          document_name: data.document_name,
          document_url: data.document_url,
        });

      if (docError) {
        console.error('Warning: Document insertion failed:', docError);
      }

      // Automatically reset verification status to pending upon document resubmission
      await adminDb
        .from('psychiatrists')
        .update({ verification_status: 'pending' })
        .eq('id', user.id);
    }

    revalidatePath('/psychiatrist');
    revalidatePath('/psychiatrist/profile');
    revalidatePath(`/psychiatrists/${user.id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('savePsychiatristProfile action failed:', error);
    return { success: false, error: error.message };
  }
}

export async function createAvailabilitySlots(slots: { start_time: string; end_time: string }[]) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // Verify psychiatrist is verified before allowing slot additions
    const { data: doctor } = await adminDb
      .from('psychiatrists')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (doctor?.verification_status !== 'verified') {
      return { success: false, error: 'Your account is not yet verified. Unverified doctors cannot open availability slots.' };
    }

    const inserts = slots.map((s) => ({
      psychiatrist_id: user.id,
      start_time: s.start_time,
      end_time: s.end_time,
      is_booked: false,
    }));

    const { error } = await adminDb.from('availability_slots').insert(inserts);

    if (error) {
      if (error.code === '23505') {
        throw new Error('One or more slots overlap with existing timeslots.');
      }
      throw error;
    }

    revalidatePath('/psychiatrist/availability');
    revalidatePath(`/psychiatrists/${user.id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('createAvailabilitySlots action failed:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAvailabilitySlot(slotId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();
    
    // Delete slot if it is owned by this user and not booked yet
    const { error } = await adminDb
      .from('availability_slots')
      .delete()
      .eq('id', slotId)
      .eq('psychiatrist_id', user.id)
      .eq('is_booked', false);

    if (error) throw error;

    revalidatePath('/psychiatrist/availability');
    revalidatePath(`/psychiatrists/${user.id}`);

    return { success: true };
  } catch (error: any) {
    console.error('deleteAvailabilitySlot failed:', error);
    return { success: false, error: error.message };
  }
}

export async function updateBookingStatusByDoctor(bookingId: string, action: 'accept' | 'reject') {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // Verify booking belongs to this psychiatrist
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking record not found' };
    }

    if (booking.psychiatrist_id !== user.id) {
      return { success: false, error: 'Unauthorized booking owner' };
    }

    if (action === 'accept') {
      if (booking.approval_status === 'approved') {
        return { success: false, error: 'Booking has already been approved' };
      }

      const { error } = await adminDb
        .from('bookings')
        .update({
          status: 'booked',
          approval_status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Credit psychiatrist metrics
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

      // Notify patient
      await adminDb.from('notifications').insert({
        user_id: booking.patient_id,
        title: 'Appointment Approved!',
        content: `Your appointment scheduled for ${new Date(booking.scheduled_time).toLocaleString()} has been approved by the doctor.`,
      });
    } else {
      // Reject / Cancel
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

      // Free up availability slot
      if (booking.slot_id) {
        await adminDb
          .from('availability_slots')
          .update({ is_booked: false })
          .eq('id', booking.slot_id);
      }

      // Notify patient
      await adminDb.from('notifications').insert({
        user_id: booking.patient_id,
        title: 'Appointment Declined',
        content: `Your appointment scheduled for ${new Date(booking.scheduled_time).toLocaleString()} has been declined by the doctor. A refund (if paid) is being initiated.`,
      });
    }

    revalidatePath('/psychiatrist/appointments');
    revalidatePath('/psychiatrist/earnings');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('updateBookingStatusByDoctor failed:', error);
    return { success: false, error: error.message };
  }
}

export async function completePsychiatristOnboarding(data: {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  specializationId: string;
  experienceYears: number;
  consultationFee: number;
  gender: string;
  languagesSpoken: string[];
  bio: string;
  education: string;
  documentName: string;
  documentUrl: string;
  customSpecializationName?: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    // 1. Update user identity details and custom avatar
    const { error: userError } = await adminDb
      .from('users')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (userError) {
      throw new Error(`Failed to update user identity: ${userError.message}`);
    }

    // Resolve specializationId
    let finalSpecializationId = data.specializationId;
    if (data.customSpecializationName?.trim()) {
      const { data: existing } = await adminDb
        .from('specializations')
        .select('id')
        .eq('name', data.customSpecializationName.trim())
        .maybeSingle();

      if (existing) {
        finalSpecializationId = existing.id;
      } else {
        const { data: inserted, error: insertErr } = await adminDb
          .from('specializations')
          .insert({
            name: data.customSpecializationName.trim(),
            description: 'Clinician entered custom specialization during profile creation.',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          throw new Error(`Failed to insert custom specialization: ${insertErr?.message}`);
        }
        finalSpecializationId = inserted.id;
      }
    }

    // 2. Update/Upsert psychiatrist professional details
    const { error: profileError } = await adminDb
      .from('psychiatrists')
      .upsert({
        id: user.id,
        specialization_id: finalSpecializationId || null,
        experience_years: data.experienceYears,
        consultation_fee: data.consultationFee,
        gender: data.gender,
        languages_spoken: data.languagesSpoken,
        bio: data.bio,
        education: data.education,
        verification_status: process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true' ? 'verified' : 'pending',
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      throw new Error(`Psychiatrist details save failed: ${profileError.message}`);
    }

    // 3. Insert license verification document
    if (data.documentName && data.documentUrl) {
      const { error: docError } = await adminDb
        .from('psychiatrist_documents')
        .insert({
          psychiatrist_id: user.id,
          document_name: data.documentName,
          document_url: data.documentUrl,
        });

      if (docError) {
        console.error('Warning: Onboarding verification document failed to insert:', docError);
      }
    }

    // Revalidate paths for consistent client state updates
    revalidatePath('/psychiatrist');
    revalidatePath('/psychiatrist/profile');
    revalidatePath(`/psychiatrists/${user.id}`);
    revalidatePath('/psychiatrists');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('completePsychiatristOnboarding failed:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFileAction(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const file = formData.get('file') as any;
    const bucket = (formData.get('bucket') as string) || 'general';

    if (!file || typeof file.arrayBuffer !== 'function') {
      return { success: false, error: 'No file selected or file is invalid' };
    }

    const adminDb = createAdminClient();

    // 1. Ensure bucket exists and is public
    const { error: getError } = await adminDb.storage.getBucket(bucket);
    if (getError) {
      // Bucket might not exist, attempt to create it
      const { error: createError } = await adminDb.storage.createBucket(bucket, {
        public: true,
      });
      if (createError) {
        console.error(`Failed to create bucket ${bucket}:`, createError);
      }
    }

    // 2. Upload file
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const fileExt = file.name.split('.').pop() || '';
    // Unique filename: user_id/timestamp_random.ext
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await adminDb.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        duplex: 'half',
      });

    if (uploadError) {
      throw uploadError;
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = adminDb.storage.from(bucket).getPublicUrl(fileName);

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error('File upload action failed:', error);
    return { success: false, error: error.message || 'File upload failed' };
  }
}

export async function sandboxVerifyClinicianAction() {
  try {
    if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS !== 'true') {
      return { success: false, error: 'Sandbox actions are only available in development sandbox mode.' };
    }

    const user = await currentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized user session' };
    }

    const adminDb = createAdminClient();

    const { error } = await adminDb
      .from('psychiatrists')
      .update({
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/psychiatrist');
    revalidatePath('/psychiatrist/profile');
    revalidatePath(`/psychiatrists/${user.id}`);
    revalidatePath('/psychiatrists');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('sandboxVerifyClinicianAction failed:', error);
    return { success: false, error: error.message };
  }
}
