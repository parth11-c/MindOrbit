'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateBookingStatusByDoctor } from '@/actions/psychiatrist';
import { markBookingCompleted } from '@/actions/bookings';
import Link from 'next/link';
import { Check, X, Clock, User, Mail, DollarSign, Loader2, Calendar, Video } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface Patient {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
}

interface Booking {
  id: string;
  scheduled_time: string;
  status: string;
  payment_status: string;
  amount: number;
  patient_id: string;
  approval_status: string;
  users: Patient | null;
}

interface AppointmentsClientProps {
  initialBookings: Booking[];
  psychiatristId: string;
}

export default function AppointmentsClient({ initialBookings, psychiatristId }: AppointmentsClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [activeTab, setActiveTab] = useState<'booked' | 'completed' | 'cancelled'>('booked');
  const [actionId, setActionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('doctor_appointments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `psychiatrist_id=eq.${psychiatristId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBooking = payload.new as any;
            
            // Fetch user info for the new booking
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name, email, avatar_url')
              .eq('id', newBooking.patient_id)
              .single();
              
            const formatted: Booking = {
              id: newBooking.id,
              scheduled_time: newBooking.scheduled_time,
              status: newBooking.status,
              payment_status: newBooking.payment_status,
              amount: Number(newBooking.amount),
              patient_id: newBooking.patient_id,
              approval_status: newBooking.approval_status,
              users: userData ? {
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                avatar_url: userData.avatar_url || '',
              } : null,
            };
            
            setBookings((prev) => {
              if (prev.some((b) => b.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedBooking = payload.new as any;
            setBookings((prev) =>
              prev.map((b) => {
                if (b.id === updatedBooking.id) {
                  return {
                    ...b,
                    status: updatedBooking.status,
                    approval_status: updatedBooking.approval_status,
                    payment_status: updatedBooking.payment_status,
                    amount: Number(updatedBooking.amount),
                  };
                }
                return b;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const oldBooking = payload.old as any;
            setBookings((prev) => prev.filter((b) => b.id !== oldBooking.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [psychiatristId]);

  const handleAction = async (bookingId: string, type: 'accept' | 'complete' | 'reject') => {
    setActionId(bookingId);
    
    startTransition(async () => {
      try {
        let res;
        if (type === 'complete') {
          res = await markBookingCompleted(bookingId);
        } else if (type === 'accept') {
          res = await updateBookingStatusByDoctor(bookingId, 'accept');
        } else {
          res = await updateBookingStatusByDoctor(bookingId, 'reject');
        }

        if (res.success) {
          // Update client state
          setBookings((prev) =>
            prev.map((b) => {
              if (b.id === bookingId) {
                return {
                  ...b,
                  status: type === 'complete' ? 'completed' : (type === 'reject' ? 'cancelled' : b.status),
                  approval_status: type === 'accept' ? 'approved' : (type === 'reject' ? 'rejected' : b.approval_status),
                  payment_status: type === 'reject' && b.payment_status === 'paid' ? 'refunded' : b.payment_status,
                };
              }
              return b;
            })
          );
          
          if (type === 'accept') {
            router.push(`/session/${bookingId}`);
          }
        } else {
          alert(res.error || 'Operation failed');
        }
      } catch (err: any) {
        alert(err.message || 'Operation failed');
      } finally {
        setActionId(null);
      }
    });
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'booked') return b.status === 'booked' || b.status === 'pending_payment';
    if (activeTab === 'completed') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-800">
        {(['booked', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold uppercase tracking-wider py-3 px-6 border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-red-600 text-red-750 font-extrabold'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {tab === 'booked' ? 'Active Bookings' : tab === 'completed' ? 'Completed' : 'Cancelled & Refunded'}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-16 text-center text-sm text-neutral-500">
          <Calendar className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <span>No appointments found in this category.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => {
            const isProcessing = actionId === booking.id && isPending;
            const patientName = booking.users
              ? `${booking.users.first_name} ${booking.users.last_name}`
              : 'Anonymous Patient';

            let badgeClass = 'bg-neutral-100 text-neutral-500';
            let badgeText = booking.status;

            if (booking.status === 'pending_payment') {
              badgeClass = 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400';
              badgeText = 'Pending Pay';
            } else if (booking.status === 'booked') {
              if (booking.approval_status === 'pending') {
                badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                badgeText = 'Pending Approval';
              } else {
                badgeClass = 'bg-emerald-50 text-emerald-750 dark:bg-emerald-950/30 dark:text-emerald-400';
                badgeText = 'Approved';
              }
            } else if (booking.status === 'completed') {
              badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450';
              badgeText = 'Completed';
            } else if (booking.status === 'cancelled') {
              badgeClass = 'bg-red-50 text-red-650 dark:bg-red-950/30 dark:text-red-400';
              badgeText = 'Cancelled';
            }

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-600">
                      {booking.users?.first_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                        {patientName}
                      </h3>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{booking.users?.email || 'No email'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${badgeClass}`}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* Details */}
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl space-y-2 text-xs border border-neutral-100 dark:border-neutral-900">
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date:</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">{formatDate(booking.scheduled_time)}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time Slot:</span>
                    <span className="font-semibold text-neutral-800 dark:text-white">{formatTime(booking.scheduled_time)}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Fee Paid:</span>
                    <span className="font-bold text-red-800">{formatCurrency(booking.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                    <span>Payment Status:</span>
                    <span className="font-bold uppercase text-[10px] text-neutral-850 dark:text-neutral-200">{booking.payment_status}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {booking.status === 'booked' && (
                  <div className="flex gap-3 border-t dark:border-neutral-800 pt-4">
                    {booking.approval_status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAction(booking.id, 'reject')}
                          disabled={isProcessing}
                          className="flex-1 border border-neutral-250 hover:border-red-250 dark:border-neutral-800 dark:hover:border-red-900/50 text-xs font-semibold py-2.5 rounded-lg text-neutral-500 hover:text-red-650 dark:text-neutral-400 dark:hover:text-red-450 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Decline & Refund</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, 'accept')}
                          disabled={isProcessing}
                          className="flex-1 bg-emerald-655 hover:bg-emerald-700 dark:bg-emerald-750 dark:hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Appointment</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(booking.id, 'reject')}
                          disabled={isProcessing}
                          className="flex-1 border border-neutral-205 dark:border-neutral-800 hover:border-red-200 text-xs font-semibold py-2.5 rounded-lg text-neutral-500 hover:text-red-650 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </>
                          )}
                        </button>
                        <Link
                          href={`/session/${booking.id}`}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Live</span>
                        </Link>
                        <button
                          onClick={() => handleAction(booking.id, 'complete')}
                          disabled={isProcessing}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
