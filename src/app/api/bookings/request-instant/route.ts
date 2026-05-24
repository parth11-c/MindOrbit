import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { psychiatristId, slotId, amount } = body;

    if (!psychiatristId) {
      return NextResponse.json({ error: 'Missing psychiatrist ID' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Insert pending booking in database, bypassing payment
    const { data: booking, error: bookingError } = await adminDb
      .from('bookings')
      .insert({
        patient_id: user.id,
        psychiatrist_id: psychiatristId,
        slot_id: slotId || null,
        scheduled_time: new Date().toISOString(), // Instant meeting is requested for 'now'
        status: 'booked', // Active booking awaiting approval
        payment_status: 'pending',
        approval_status: 'pending',
        amount: Number(amount || 0),
        commission_amount: 0,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error inserting instant booking:', bookingError);
      return NextResponse.json({ error: 'Failed to request instant booking' }, { status: 500 });
    }

    // Optional: Notify doctor
    await adminDb.from('notifications').insert({
      user_id: psychiatristId,
      title: 'New Instant Request',
      content: 'A patient is in the waiting room requesting an instant session. Please check your appointments tab.',
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    });
  } catch (err: any) {
    console.error('Instant request failed:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
