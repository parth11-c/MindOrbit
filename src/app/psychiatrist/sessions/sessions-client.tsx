'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateBookingStatusByDoctor } from '@/actions/psychiatrist';
import { markBookingCompleted, getDoctorActiveBookings } from '@/actions/bookings';
import { Check, X, Clock, User, Mail, DollarSign, Loader2, Video, VideoOff } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

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

interface SessionsClientProps {
  initialBookings: Booking[];
  psychiatristId: string;
}

export default function SessionsClient({ initialBookings, psychiatristId }: SessionsClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [actionId, setActionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchLatestBookings = async () => {
      const res = await getDoctorActiveBookings();
      if (res.success && res.bookings) {
        setBookings(res.bookings as any);
      }
    };

    // Subscriptions
    const channel = supabase
      .channel('doctor_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `psychiatrist_id=eq.${psychiatristId}`,
        },
        () => {
          fetchLatestBookings();
        }
      )
      .subscribe();

    const interval = setInterval(fetchLatestBookings, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [psychiatristId, supabase]);

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
          if (type === 'reject' || type === 'complete') {
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          } else {
            setBookings((prev) =>
              prev.map((b) => {
                if (b.id === bookingId) {
                  return {
                    ...b,
                    approval_status: 'approved',
                  };
                }
                return b;
              })
            );
            // Redirect Doctor to live session page immediately
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

  const pendingRequests = bookings.filter((b) => b.approval_status === 'pending');
  const activeSessions = bookings.filter((b) => b.approval_status === 'approved');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Pending Approvals (Requires Action) */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-650 animate-pulse" />
          <span>Pending Consultation Requests ({pendingRequests.length})</span>
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-8 rounded-2xl text-center text-xs text-neutral-450 font-medium">
            <VideoOff className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <span>No pending on-demand requests. Patients will appear here as soon as they request a consultation.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRequests.map((booking) => {
              const isProcessing = actionId === booking.id && isPending;
              const patientName = booking.users
                ? `${booking.users.first_name} ${booking.users.last_name}`
                : 'Anonymous Patient';

              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-neutral-900 border border-red-200/50 dark:border-red-950/20 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow transition-shadow relative overflow-hidden"
                >
                  {/* Subtle red tint glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-105 dark:bg-neutral-800 flex items-center justify-center font-extrabold text-xs text-neutral-600 dark:text-white">
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
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-amber-50 text-amber-705 rounded dark:bg-amber-950/20 dark:text-amber-400 animate-pulse">
                      Pending Accept
                    </span>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <div className="flex justify-between">
                      <span>Requested Date/Time:</span>
                      <span className="font-bold text-neutral-850 dark:text-white">{formatDate(booking.scheduled_time)} {formatTime(booking.scheduled_time)}</span>
                    </div>
                    <div className="flex justify-between text-red-800">
                      <span>Consultation Fee:</span>
                      <span className="font-extrabold">{formatCurrency(booking.amount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleAction(booking.id, 'reject')}
                      disabled={isProcessing}
                      className="flex-1 border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold py-2.5 rounded-xl text-neutral-500 hover:text-red-655 dark:text-neutral-450 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Request</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'accept')}
                      disabled={isProcessing}
                      className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Join Call</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Active Approved Sessions */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active / Approved Live Sessions ({activeSessions.length})</span>
        </h2>

        {activeSessions.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-8 rounded-2xl text-center text-xs text-neutral-450 font-medium">
            <Video className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <span>No active ongoing sessions. Accepted consult requests will display here.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSessions.map((booking) => {
              const isProcessing = actionId === booking.id && isPending;
              const patientName = booking.users
                ? `${booking.users.first_name} ${booking.users.last_name}`
                : 'Anonymous Patient';

              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-105 dark:bg-neutral-800 flex items-center justify-center font-extrabold text-xs text-neutral-600 dark:text-white">
                        {booking.users?.first_name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                          {patientName}
                        </h3>
                        <p className="text-[10px] text-neutral-450 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{booking.users?.email || 'No email'}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-450 rounded">
                      Live
                    </span>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <div className="flex justify-between">
                      <span>Scheduled Time:</span>
                      <span className="font-bold text-neutral-850 dark:text-white">{formatDate(booking.scheduled_time)} {formatTime(booking.scheduled_time)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleAction(booking.id, 'complete')}
                      disabled={isProcessing}
                      className="border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold py-2.5 rounded-xl text-neutral-550 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-450 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/session/${booking.id}`}
                      className="flex-grow bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Live Room</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
