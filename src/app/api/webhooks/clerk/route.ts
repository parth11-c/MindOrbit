import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response('Clerk Webhook Secret is missing', { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  const eventType = evt.type;
  const supabase = createAdminClient();

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const fname = first_name || '';
    const lname = last_name || '';

    if (!email) {
      return new Response('Error: Missing email address', { status: 400 });
    }

    const isDefaultAvatar = (url: string | null) => {
      if (!url) return true;
      const lower = url.toLowerCase();
      return lower.includes('placeholder') || lower.includes('default_user') || (lower.includes('clerk') && (lower.includes('placeholder') || lower.includes('avatar') || lower.includes('user') || lower.includes('gravatar')));
    };

    // Keep custom avatar if it exists in DB, otherwise use Clerk's image
    const { data: existingUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', id)
      .maybeSingle();

    const avatar = (existingUser?.avatar_url && !isDefaultAvatar(existingUser.avatar_url))
      ? existingUser.avatar_url
      : (image_url || '');

    // Determine default role
    let role = 'patient';
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin') || emailLower === 'admin@mindorbit.com') {
      role = 'admin';
    } else if (public_metadata?.role) {
      role = public_metadata.role as string;
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        first_name: fname,
        last_name: lname,
        avatar_url: avatar,
        role,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error upserting user to Supabase:', error);
      return new Response('Database Error', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (id) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user from Supabase:', error);
        return new Response('Database Error', { status: 500 });
      }
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
