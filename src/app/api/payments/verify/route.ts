import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature, isMock } = body;

    const adminDb = createAdminClient();

    // 1. Fetch booking details
    const { data: booking, error: fetchErr } = await adminDb
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
    }

    // Security check: ensure current user is the owner of this booking
    if (booking.patient_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized booking owner' }, { status: 403 });
    }

    // 2. Signature verification
    const isMockPayments = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true' || isMock;

    if (!isMockPayments) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return NextResponse.json({ error: 'Razorpay configuration secret missing' }, { status: 500 });
      }

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment signature tokens' }, { status: 400 });
      }

      // Hmac signature confirmation
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        // Mark payment as failed in database
        await adminDb
          .from('bookings')
          .update({ payment_status: 'failed', status: 'cancelled' })
          .eq('id', bookingId);

        return NextResponse.json({ error: 'Payment signature mismatch' }, { status: 400 });
      }
    }

    // 3. Begin Atomic DB transaction updates (simulated via individual triggers / sequential calls)
    
    // a. Update booking status
    const paymentId = razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
    const orderId = razorpay_order_id || booking.razorpay_order_id;
    const signatureToken = razorpay_signature || `sig_mock_${Math.random().toString(36).substring(2, 11)}`;

    const { error: bookingUpdateErr } = await adminDb
      .from('bookings')
      .update({
        status: 'booked',
        payment_status: 'paid',
        approval_status: 'pending',
        razorpay_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingUpdateErr) {
      throw new Error(`Failed to update booking status: ${bookingUpdateErr.message}`);
    }

    // b. Set slot to booked
    if (booking.slot_id) {
      const { error: slotUpdateErr } = await adminDb
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', booking.slot_id);

      if (slotUpdateErr) {
        console.error('Warning: Failed to lock slot reservation:', slotUpdateErr);
      }
    }

    // d. Log payment transaction
    await adminDb
      .from('payments')
      .insert({
        booking_id: bookingId,
        patient_id: booking.patient_id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureToken,
        amount: booking.amount,
        status: 'captured',
      });

    // e. Send system alerts / in-app notifications
    // Patient Alert
    const sessionTimeFormatted = new Date(booking.scheduled_time).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await adminDb.from('notifications').insert([
      {
        user_id: booking.patient_id,
        title: 'Booking Pending Approval',
        content: `Your payment was verified! Your consultation request for ${sessionTimeFormatted} has been sent to the doctor and is pending approval.`,
      },
      {
        user_id: booking.psychiatrist_id,
        title: 'New Booking Request',
        content: `A new session for ${sessionTimeFormatted} is waiting for your approval. Check details in your Appointments Manager.`,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Verify payment endpoint failure:', err);
    return NextResponse.json({ error: err.message || 'Internal verification fail' }, { status: 500 });
  }
}
