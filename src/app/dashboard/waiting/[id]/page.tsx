import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import WaitingClient from './waiting-client';

export default async function WaitingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();
  const { data: booking } = await adminDb
    .from('bookings')
    .select(`
      id,
      psychiatrists (
        users (
          first_name,
          last_name,
          avatar_url
        ),
        specializations (
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  const doctor = booking?.psychiatrists ? {
    firstName: (booking.psychiatrists as any).users?.first_name || '',
    lastName: (booking.psychiatrists as any).users?.last_name || '',
    avatarUrl: (booking.psychiatrists as any).users?.avatar_url || '',
    specialization: (booking.psychiatrists as any).specializations?.name || 'Psychiatrist',
  } : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <WaitingClient bookingId={id} doctor={doctor} />
    </div>
  );
}
