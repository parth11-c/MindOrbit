import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { psychiatristId, slotId, amount } = body;

    if (!psychiatristId || !slotId || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch and validate slot availability
    const { data: slot, error: slotError } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Selected time slot does not exist' }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json({ error: 'Time slot has already been reserved' }, { status: 400 });
    }

    // 2. Fetch platform commission percentage
    let commissionPercent = 15; // default
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'platform_commission_percent')
      .single();

    if (settingsData?.value) {
      commissionPercent = Number(settingsData.value);
    }

    const commissionAmount = Number(((amount * commissionPercent) / 100).toFixed(2));

    // 3. Insert booking in database (bypass standard policies using admin client to enforce transaction integrity)
    const adminDb = createAdminClient();
    const isFree = Number(amount) === 0;

    const { data: booking, error: bookingError } = await adminDb
      .from('bookings')
      .insert({
        patient_id: user.id,
        psychiatrist_id: psychiatristId,
        slot_id: slotId,
        scheduled_time: slot.start_time,
        status: isFree ? 'booked' : 'pending_payment',
        payment_status: isFree ? 'paid' : 'pending',
        approval_status: isFree ? 'approved' : 'pending',
        amount: Number(amount),
        commission_amount: commissionAmount,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error inserting booking:', bookingError);
      return NextResponse.json({ error: 'Failed to initialize booking record' }, { status: 500 });
    }

    const bookingId = booking.id;

    if (isFree) {
      // Mark slot as booked automatically for free sessions
      await adminDb
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slotId);

      return NextResponse.json({
        success: true,
        bookingId,
        isFree: true,
        amount: 0,
      });
    }
    const isMock = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

    let orderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;

    // 4. Create actual Razorpay Order if not in mock mode
    if (!isMock) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        console.error('Razorpay keys missing. Forcing fallback mock payment.');
      } else {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
          amount: Number(amount) * 100, // Razorpay amount in paise
          currency: 'INR',
          receipt: bookingId,
        });

        orderId = order.id;
      }
    }

    // 5. Update booking with the Razorpay order ID
    await adminDb
      .from('bookings')
      .update({ razorpay_order_id: orderId })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      bookingId,
      orderId,
      amount: Number(amount),
    });
  } catch (err: any) {
    console.error('Create-order route failed:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
