'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, CreditCard, ArrowRight, Loader2, Sparkles, X, Video } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface BookingCalendarProps {
  psychiatristId: string;
  slots: Slot[];
  fee: number;
  isMockEnabled: boolean;
  patientId: string | null;
}

export default function BookingCalendar({
  psychiatristId,
  slots,
  fee,
  isMockEnabled,
  patientId,
}: BookingCalendarProps) {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockCardName, setMockCardName] = useState('');
  const [mockCardNumber, setMockCardNumber] = useState('4111 1111 1111 1111');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Group slots by date
  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: Slot[] } = {};
    slots.forEach((slot) => {
      const dateKey = new Date(slot.start_time).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });
    return groups;
  }, [slots]);

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.id === selectedSlotId) || null;
  }, [slots, selectedSlotId]);

  const handleBookClick = async () => {
    if (!patientId) {
      router.push('/sign-in');
      return;
    }

    if (!selectedSlotId) return;

    setLoading(true);

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychiatristId,
          slotId: selectedSlotId,
          amount: fee,
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to create booking order');
      }

      if (orderData.isFree) {
        // Bypass payment gateway for free sessions
        router.push('/dashboard?booking=success');
        return;
      }

      const { bookingId, orderId, amount } = orderData;
      setActiveBookingId(bookingId);

      if (isMockEnabled) {
        setLoading(false);
        setShowMockModal(true);
      } else {
        await startRazorpayCheckout(orderId, bookingId, amount);
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during reservation.');
      setLoading(false);
    }
  };

  const handleInstantConnect = async () => {
    if (!patientId) {
      router.push('/sign-in');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings/request-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychiatristId,
          amount: fee,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request instant session');
      }

      router.push(`/dashboard/waiting/${data.bookingId}`);
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
      setLoading(false);
    }
  };

  const startRazorpayCheckout = async (orderId: string, bookingId: string, amount: number) => {
    const loadScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const isLoaded = await loadScript();
    if (!isLoaded) {
      alert('Failed to load Razorpay SDK. Try disabling ad-blockers.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid',
      amount: amount * 100,
      currency: 'INR',
      name: 'MindOrbit LLC',
      description: 'Online Psychiatric Consultation Session',
      order_id: orderId,
      handler: async function (response: any) {
        setLoading(true);
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.push('/dashboard?booking=success');
          } else {
            throw new Error(verifyData.error || 'Payment signature verify failed');
          }
        } catch (err: any) {
          alert('Payment verification failed: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        email: 'patient@mindorbit.com',
      },
      theme: {
        color: '#7452e6', // Calm Lavender
      },
    };

    const rzp = (window as any).Razorpay ? new (window as any).Razorpay(options) : null;
    if (rzp) {
      rzp.open();
    } else {
      alert('Razorpay object not found.');
    }
    setLoading(false);
  };

  const handleMockPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId) return;

    setLoading(true);
    setShowMockModal(false);

    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: activeBookingId,
          isMock: true,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        router.push('/dashboard?booking=success');
      } else {
        throw new Error(verifyData.error || 'Mock transaction recording failed');
      }
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
      <div className="space-y-1">
        <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
          <CalendarIcon className="w-4 h-4 text-red-800" />
          <span>Select Availability</span>
        </h2>
        <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-medium">Pick an available session time slot.</p>
      </div>

      {slots.length === 0 ? (
        <div className="border border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500 font-medium">
          <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <span>No available slots found.</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
          {Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{formatDate(date)}</h3>
              <div className="grid grid-cols-3 gap-2">
                {dateSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`text-[10px] py-2 rounded-xl border font-bold transition-all ${
                      selectedSlotId === slot.id
                        ? 'bg-red-600 border-red-650 text-white shadow-sm'
                        : 'border-neutral-200/60 dark:border-neutral-850 text-neutral-700 dark:text-neutral-350 hover:border-red-200 hover:bg-red-50/20'
                    }`}
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSlot && (
        <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl p-4 border border-neutral-100 dark:border-neutral-900 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          <div className="flex justify-between">
            <span>Date:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {formatDate(selectedSlot.start_time)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Time slot:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
            </span>
          </div>
          <div className="flex justify-between border-t dark:border-neutral-850 pt-2.5 font-bold text-neutral-950 dark:text-white">
            <span>Session Fee:</span>
            <span className="text-red-800">{formatCurrency(fee)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleInstantConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-semibold py-3.5 rounded-full transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed text-xs hover-lift"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5" />
              <span>{patientId ? 'Request Instant Session' : 'Log in to connect instantly'}</span>
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t dark:border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
            <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-400">Or Schedule</span>
          </div>
        </div>

        <button
        onClick={handleBookClick}
        disabled={!selectedSlotId || loading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-750 disabled:bg-neutral-200 disabled:text-neutral-400 text-neutral-900 dark:text-neutral-950 font-semibold py-3.5 rounded-full transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed text-xs hover-lift"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Reserving Slot...</span>
          </>
        ) : (
          <>
            <span>{patientId ? 'Book Appointment Now' : 'Log in to reserve session'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
        </button>
      </div>

      {/* Visual Sandbox Mock Checkout Modal */}
      {showMockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 max-w-sm w-full rounded-2xl border border-neutral-100 dark:border-neutral-850 shadow-xl p-6 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-50 dark:border-neutral-850">
              <div className="flex items-center space-x-1.5 text-red-800">
                <Sparkles className="w-4 h-4 text-red-800 fill-red-100" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest">Sandbox payment</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMockModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">Simulate Reservation</h3>
              <p className="text-[10px] text-neutral-450 leading-relaxed font-medium">
                You are in sandbox checkout mode. Confirming will complete the transaction instantly.
              </p>
            </div>

            <form onSubmit={handleMockPaymentSubmit} className="space-y-4 pt-1">
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Amount Due</label>
                <p className="text-xl font-extrabold text-neutral-950 dark:text-white mt-0.5">{formatCurrency(fee)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase">Card Holder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={mockCardName}
                    onChange={(e) => setMockCardName(e.target.value)}
                    className="w-full mt-1 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase">Mock Card Number</label>
                  <input
                    type="text"
                    disabled
                    value={mockCardNumber}
                    className="w-full mt-1 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs bg-neutral-100 dark:bg-neutral-950 text-neutral-500 cursor-not-allowed font-mono font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-50 dark:border-neutral-850">
                <button
                  type="button"
                  onClick={() => setShowMockModal(false)}
                  className="flex-1 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold py-2.5 rounded-full text-neutral-600 dark:text-neutral-450 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-semibold py-2.5 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Confirm Pay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
