'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getBookingStatus } from '@/actions/bookings';
import { Loader2, Video, Clock, X, Check, Shield } from 'lucide-react';

interface DoctorInfo {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  specialization: string;
}

export default function WaitingClient({
  bookingId,
  doctor,
}: {
  bookingId: string;
  doctor: DoctorInfo | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      console.error('WaitingClient error: bookingId is undefined');
      return;
    }

    const checkStatus = async () => {
      const res = await getBookingStatus(bookingId);
      if (res.success) {
        if (res.status === 'confirmed' || res.approval_status === 'approved') {
          router.push(`/session/${bookingId}`);
        } else if (res.status === 'cancelled' || res.status === 'rejected' || res.approval_status === 'rejected') {
          alert('The psychiatrist has declined the instant consult request or is currently unavailable.');
          router.push('/dashboard');
        }
      }
    };
    
    // Run initial check
    checkStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`waiting_room_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const newApprovalStatus = payload.new.approval_status;
          
          if (newStatus === 'confirmed' || newApprovalStatus === 'approved') {
            router.push(`/session/${bookingId}`);
          } else if (newStatus === 'cancelled' || newStatus === 'rejected' || newApprovalStatus === 'rejected') {
            alert('The psychiatrist has declined the instant consult request or is currently unavailable.');
            router.push('/dashboard');
          }
        }
      )
      .subscribe();

    // Polling fallback every 3 seconds in case realtime is not configured on the bookings table
    const interval = setInterval(checkStatus, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [bookingId, router, supabase]);

  const handleCancel = async () => {
    if (!bookingId || bookingId === 'undefined') return;
    if (!confirm('Are you sure you want to cancel your instant session request?')) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          approval_status: 'rejected',
        })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }
      router.push('/dashboard');
    } catch (err: any) {
      alert('Failed to cancel request: ' + (err.message || 'Error occurred'));
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-8 text-center px-4 animate-fadeIn">
      {/* Premium Glassmorphic Card */}
      <div className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/40 shadow-xl rounded-3xl p-8 md:p-10 max-w-md w-full space-y-8 relative overflow-hidden">
        
        {/* Glow overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-100/30 dark:bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic Status Icon */}
        <div className="relative flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center border border-red-100/50 dark:border-red-900/30 shadow-inner relative">
            <Loader2 className="w-9 h-9 text-red-750 animate-spin" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white shadow-md flex items-center justify-center border border-white dark:border-neutral-900 animate-pulse">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            Consultation Waiting Room
          </h2>
          <p className="text-xs text-neutral-450 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Your instant consult request has been dispatched to the doctor. Keep this page open; your secure live connection will open automatically.
          </p>
        </div>

        {/* Live Doctor Profile Section */}
        {doctor && (
          <div className="bg-neutral-50/50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-850/80 p-4 rounded-2xl flex items-center gap-4 relative shadow-sm">
            <div className="relative flex-shrink-0">
              <img
                src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250'}
                alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-200/60 dark:border-neutral-800"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white dark:border-neutral-900"></span>
              </span>
            </div>
            <div className="text-left flex-grow">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Consultant Specialist</span>
              <span className="text-xs font-serif font-extrabold text-neutral-900 dark:text-white mt-0.5 block">
                Dr. {doctor.firstName} {doctor.lastName}
              </span>
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mt-0.5">
                {doctor.specialization}
              </span>
            </div>
          </div>
        )}

        {/* Status Indicators List */}
        <div className="space-y-3 pt-2 text-left border-t border-b py-6 border-neutral-100 dark:border-neutral-850/60">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-neutral-500 font-semibold dark:text-neutral-400">Request submitted successfully</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            <span className="text-neutral-500 font-semibold dark:text-neutral-400">Psychiatrist notified in real-time</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
            <span className="text-neutral-900 font-bold dark:text-white animate-pulse">Awaiting doctor approval...</span>
          </div>

          <div className="flex items-center gap-3 text-xs opacity-50">
            <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
              <Shield className="w-3 h-3" />
            </div>
            <span className="text-neutral-550 dark:text-neutral-500">Redirecting to secure live video room</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/10 text-amber-705 dark:text-amber-400 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Please keep this page open</span>
          </div>

          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full text-center text-xs font-semibold text-neutral-400 hover:text-red-650 transition-colors flex items-center justify-center gap-1.5 py-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {cancelling ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Cancelling Request...</span>
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cancel Request & Exit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
