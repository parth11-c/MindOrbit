'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Video, Clock, MessageSquare, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { cancelBookingByPatient } from '@/actions/bookings';
import { submitReview } from '@/actions/reviews';

interface Booking {
  id: string;
  scheduled_time: string;
  amount: number;
  status: 'pending_payment' | 'booked' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  approval_status: 'pending' | 'approved' | 'rejected';
  doctor: {
    id: string;
    name: string;
    specialization: string;
    avatar_url?: string;
  };
  hasReview: boolean;
}

interface BookingsClientProps {
  bookings: Booking[];
}

export default function BookingsClient({ bookings }: BookingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isLoading, setIsLoading] = useState<string | null>(null); // bookingId
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review modal states
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Filter bookings based on status tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return b.status === 'booked' || b.status === 'pending_payment';
    } else if (activeTab === 'completed') {
      return b.status === 'completed';
    } else {
      return b.status === 'cancelled';
    }
  });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Submitting will free up the slot and initiate a refund.')) {
      return;
    }

    setIsLoading(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await cancelBookingByPatient(bookingId);
      if (res.success) {
        setSuccessMsg('Booking cancelled successfully and slot freed up.');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to cancel appointment.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    setIsSubmittingReview(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await submitReview({
        bookingId: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (res.success) {
        setSuccessMsg(`Your review for ${reviewBooking.doctor.name} has been submitted.`);
        setReviewBooking(null);
        setReviewComment('');
        setReviewRating(5);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to submit review.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-850 gap-6">
        {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Ledger */}
      {filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => {
            const isCancelable = 
              booking.status === 'booked' && 
              (new Date(booking.scheduled_time).getTime() - Date.now()) > (1000 * 60 * 60 * 4); // 4 hours

            let badgeClass = 'bg-neutral-100 text-neutral-500';
            let badgeText: string = booking.status;

            if (booking.status === 'completed') {
              badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
              badgeText = 'Completed';
            } else if (booking.status === 'cancelled') {
              badgeClass = 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
              badgeText = 'Cancelled';
            } else if (booking.status === 'pending_payment') {
              badgeClass = 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400';
              badgeText = 'Pending Pay';
            } else if (booking.status === 'booked') {
              if (booking.approval_status === 'pending') {
                badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                badgeText = 'Pending Approval';
              } else {
                badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
                badgeText = 'Approved & Scheduled';
              }
            }

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                      <img
                        src={booking.doctor.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250'}
                        alt={booking.doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                        {booking.doctor.name}
                      </h3>
                      <p className="text-neutral-400 text-[10px] uppercase font-semibold mt-0.5">
                        {booking.doctor.specialization}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="space-y-2 border-t border-b border-neutral-50 dark:border-neutral-800 py-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span>Consultation Date:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatDate(booking.scheduled_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consultation Time:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatTime(booking.scheduled_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session Fee paid:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(booking.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Status:</span>
                    <span className={`font-semibold capitalize ${
                      booking.approval_status === 'approved' 
                        ? 'text-emerald-600' 
                        : booking.approval_status === 'pending' 
                        ? 'text-amber-600' 
                        : 'text-red-650'
                    }`}>
                      {booking.approval_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction status:</span>
                    <span className={`font-semibold capitalize ${booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-neutral-500'}`}>
                      {booking.payment_status}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  {/* Cancel Action */}
                  {activeTab === 'upcoming' && (
                    <>
                      {isCancelable ? (
                        <button
                          disabled={isLoading === booking.id}
                          onClick={() => handleCancelBooking(booking.id)}
                          className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          {isLoading === booking.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-800" />
                          )}
                          <span>Cancel Booking</span>
                        </button>
                      ) : (
                        <div className="w-full text-center text-[10px] text-amber-600 font-semibold bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                          Non-refundable: Cancelling is restricted within 4 hours.
                        </div>
                      )}
                    </>
                  )}

                  {/* Review Action */}
                  {activeTab === 'completed' && (
                    <>
                      {booking.hasReview ? (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg">
                          Review Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewBooking(booking)}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Leave a Review</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 space-y-4">
          <Calendar className="w-8 h-8 mx-auto text-neutral-300" />
          <div className="space-y-1">
            <p className="font-bold text-neutral-800 dark:text-neutral-200">No {activeTab} bookings found</p>
            <p className="text-neutral-400">Your session bookings will be organized and categorized here.</p>
          </div>
        </div>
      )}

      {/* Review Dialog overlay Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl p-6 border border-neutral-100 dark:border-neutral-850 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Review Dr. {reviewBooking.doctor.name}
              </h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="text-neutral-400 hover:text-neutral-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Star Rating</label>
                <div className="flex space-x-2 text-2xl">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starVal = i + 1;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setReviewRating(starVal)}
                        className={`transition-colors ${
                          starVal <= reviewRating ? 'text-amber-500' : 'text-neutral-200 dark:text-neutral-800'
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback text */}
              <div className="space-y-2 text-xs">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Written Feedback</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your consultation experience. How was the counseling session?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-250 dark:border-neutral-800 rounded-xl p-3 text-neutral-800 focus:outline-none focus:border-red-650 focus:ring-1 focus:ring-red-650 resize-none leading-relaxed"
                />
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
