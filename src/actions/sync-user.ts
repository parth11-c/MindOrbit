'use server';

import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function syncCurrentUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: 'Not authenticated in Clerk' };
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      return { success: false, error: 'User does not have an email' };
    }

    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUser.id)
      .single();

    let userRole = 'patient';
    const emailLower = email.toLowerCase();
    
    const cookieStore = await cookies();
    const pendingRole = cookieStore.get('pending_role')?.value;

    // Automatically make admin@mindorbit.com or users with "admin" in email an admin
    if (emailLower.includes('admin') || emailLower === 'admin@mindorbit.com') {
      userRole = 'admin';
    } else if (clerkUser.publicMetadata?.role) {
      userRole = clerkUser.publicMetadata.role as string;
    } else if (pendingRole === 'psychiatrist') {
      userRole = 'psychiatrist';
      
      // Update Clerk metadata right now so it persists
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(clerkUser.id, {
          publicMetadata: { role: 'psychiatrist' }
        });
      } catch (clerkErr) {
        console.warn('Failed to update Clerk metadata in syncCurrentUser:', clerkErr);
      }
      
      // Delete the pending role cookie
      cookieStore.delete('pending_role');
    } else if (existingUser?.role) {
      // Keep existing role
      userRole = existingUser.role;
    }

    const isDefaultAvatar = (url: string | null) => {
      if (!url) return true;
      const lower = url.toLowerCase();
      return lower.includes('placeholder') || lower.includes('default_user') || (lower.includes('clerk') && (lower.includes('placeholder') || lower.includes('avatar') || lower.includes('user') || lower.includes('gravatar')));
    };

    const first_name = clerkUser.firstName || '';
    const last_name = clerkUser.lastName || '';
    
    // Keep custom avatar if it exists in DB, otherwise use Clerk's image
    const avatar_url = (existingUser?.avatar_url && !isDefaultAvatar(existingUser.avatar_url))
      ? existingUser.avatar_url
      : (clerkUser.imageUrl || '');

    // If user does not exist, or details have changed, upsert them
    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: clerkUser.id,
        email,
        first_name,
        last_name,
        avatar_url,
        role: userRole as any,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error(`Error syncing user to Supabase: ${upsertError.message} (Code: ${upsertError.code}, Details: ${upsertError.details || 'none'}, Hint: ${upsertError.hint || 'none'})`);
      return { success: false, error: upsertError.message };
    }

    // If role is psychiatrist, make sure a psychiatrist profile exists
    if (userRole === 'psychiatrist') {
      const { data: existingPsychiatrist } = await supabase
        .from('psychiatrists')
        .select('id')
        .eq('id', clerkUser.id)
        .single();

      if (!existingPsychiatrist) {
        const { error: psychInsertError } = await supabase
          .from('psychiatrists')
          .insert({
            id: clerkUser.id,
            verification_status: 'pending',
            experience_years: 0,
            languages_spoken: ['English'],
            consultation_fee: 500.00, // Default fee
            bio: 'Onboarding psychiatrist. Please complete your profile.',
          });

        if (psychInsertError) {
          console.error(`Error initializing psychiatrist profile: ${psychInsertError.message} (Code: ${psychInsertError.code})`);
        }
      }
    }

    return { success: true, user: upsertedUser };
  } catch (error: any) {
    console.error('syncCurrentUser action failed:', error);
    return { success: false, error: error.message || 'Internal server error' };
  }
}

export async function updateUserRole(userId: string, role: 'patient' | 'psychiatrist' | 'admin') {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;

    // Try updating Clerk public metadata to ensure Clerk and Supabase stay synchronized
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          role,
        },
      });
    } catch (clerkErr) {
      console.warn('Failed to update Clerk user metadata (using mock keys or offline):', clerkErr);
    }

    // If role changed to psychiatrist, ensure profile exists
    if (role === 'psychiatrist') {
      const { data: existingPsych } = await supabase
        .from('psychiatrists')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingPsych) {
        await supabase.from('psychiatrists').insert({
          id: userId,
          verification_status: 'pending',
          experience_years: 0,
          languages_spoken: ['English'],
          consultation_fee: 500,
          bio: 'Onboarding psychiatrist. Please complete your profile.',
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('updateUserRole failed:', error);
    return { success: false, error: error.message };
  }
}

export async function handleJoinAsPsychiatrist() {
  const user = await currentUser();
  const cookieStore = await cookies();
  
  if (!user) {
    cookieStore.set('pending_role', 'psychiatrist', { maxAge: 3600, path: '/' });
    redirect('/sign-up');
  }

  const supabase = createAdminClient();
  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (dbUser && dbUser.role !== 'psychiatrist') {
    await updateUserRole(user.id, 'psychiatrist');
  } else if (!dbUser) {
    // Sync first if user record doesn't exist yet
    await syncCurrentUser();
    await updateUserRole(user.id, 'psychiatrist');
  }

  redirect('/psychiatrist');
}

