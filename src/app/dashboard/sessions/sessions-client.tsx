'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPatientActiveBookings } from '@/actions/bookings';
import { Video, Clock, X, Loader2, ArrowRight, VideoOff } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  avatar_url: string;
}

interface Booking {
  id: string;
  scheduled_time: string;
  amount: number;
  status: string;
  payment_status: string;
  approval_status: string;
  doctor: Doctor;
}

interface SessionsClientProps {
  initialBookings: Booking[];
  patientId: string;
}

export default function SessionsClient({ initialBookings, patientId }: SessionsClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Poll for updates in case realtime is not configured on the bookings table
  useEffect(() => {
    const fetchLatestBookings = async () => {
      const res = await getPatientActiveBookings();
      if (res.success && res.bookings) {
        setBookings(res.bookings as any);
      }
    };

    // Subscriptions
    const channel = supabase
      .channel('patient_sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `patient_id=eq.${patientId}`,
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
  }, [patientId, supabase]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this consult request?')) return;
    setActionId(bookingId);

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            approval_status: 'rejected',
          })
          .eq('id', bookingId);

        if (error) throw error;

        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      } catch (err: any) {
        alert(err.message || 'Failed to cancel the booking');
      } finally {
        setActionId(null);
      }
    });
  };

  const pendingApprovals = bookings.filter((b) => b.approval_status === 'pending');
  const approvedSessions = bookings.filter((b) => b.approval_status === 'approved');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Approved Sessions (Actionable Now) */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Approved Live Sessions ({approvedSessions.length})</span>
        </h2>

        {approvedSessions.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-8 rounded-2xl text-center text-xs text-neutral-450 font-medium">
            <VideoOff className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <span>No approved live session links available. Wait for the doctor to accept or browse specialists below.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvedSessions.map((booking) => {
              const isProcessing = actionId === booking.id && isPending;
              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-neutral-900 border border-emerald-100/80 dark:border-emerald-950/40 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={booking.doctor.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150'}
                        alt={booking.doctor.name}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-100 dark:border-neutral-850"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                          {booking.doctor.name}
                        </h3>
                        <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider mt-0.5">
                          {booking.doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded">
                      Approved
                    </span>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-bold text-neutral-850 dark:text-white">{formatDate(booking.scheduled_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-bold text-neutral-850 dark:text-white">{formatTime(booking.scheduled_time)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={isProcessing}
                      className="border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold px-4 py-2.5 rounded-xl text-neutral-500 hover:text-red-650 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Session</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/session/${booking.id}`}
                      className="flex-grow bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Live Session</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Pending Approvals (Wait list) */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xs font-bold text-neutral-450 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Approvals ({pendingApprovals.length})</span>
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-8 rounded-2xl text-center text-xs text-neutral-450 font-medium">
            <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <span>No pending on-demand requests. Click &apos;Browse Doctors&apos; to request an instant consult.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingApprovals.map((booking) => {
              const isProcessing = actionId === booking.id && isPending;
              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={booking.doctor.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150'}
                        alt={booking.doctor.name}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-105 dark:border-neutral-850"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                          {booking.doctor.name}
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                          {booking.doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-amber-50 text-amber-705 dark:bg-amber-950/20 dark:text-amber-400 rounded animate-pulse">
                      Awaiting Doctor
                    </span>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <div className="flex justify-between">
                      <span>Requested:</span>
                      <span className="font-bold text-neutral-850 dark:text-white">{formatDate(booking.scheduled_time)} {formatTime(booking.scheduled_time)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={isProcessing}
                      className="border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold px-4 py-2.5 rounded-xl text-neutral-500 hover:text-red-650 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Request</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/dashboard/waiting/${booking.id}`}
                      className="flex-grow bg-neutral-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <span>Enter Waiting Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
