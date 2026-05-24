'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  Trash2, 
  Flag, 
  Check, 
  AlertCircle,
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { moderateReview } from '@/actions/admin';

export interface ReviewAdminDetail {
  id: string;
  rating: number;
  comment: string;
  is_flagged: boolean;
  created_at: string;
  patientName: string;
  patientEmail: string;
  patientAvatar?: string;
  doctorName: string;
}

interface ReviewsClientProps {
  reviews: ReviewAdminDetail[];
}

export default function ReviewsClient({ reviews }: ReviewsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'positive' | 'negative'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleModeration = async (reviewId: string, action: 'keep' | 'flag' | 'delete') => {
    const confirmationMsg = 
      action === 'delete' 
        ? 'Are you sure you want to PERMANENTLY DELETE this patient review?' 
        : action === 'flag'
        ? 'Flag this review as suspicious?'
        : 'Approve this review and dismiss any flags?';

    if (!confirm(confirmationMsg)) {
      return;
    }

    setLoadingId(reviewId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await moderateReview(reviewId, action);
      if (res.success) {
        setSuccessMsg(`Review status updated successfully.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to moderate review.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = 
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'flagged') return r.is_flagged;
    if (filterType === 'positive') return r.rating >= 4;
    if (filterType === 'negative') return r.rating <= 2;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reviews by comments, patient names, or psychiatrists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 dark:bg-neutral-850 dark:text-neutral-350'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              filterType === 'flagged'
                ? 'bg-red-650 text-white shadow-sm'
                : 'bg-red-50 hover:bg-red-100 text-red-750'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flagged</span>
          </button>
          <button
            onClick={() => setFilterType('positive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'positive'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
            }`}
          >
            Positive (4-5 ★)
          </button>
          <button
            onClick={() => setFilterType('negative')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'negative'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
            }`}
          >
            Negative (1-2 ★)
          </button>
        </div>
      </div>

      {/* Reviews directory layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((r) => (
            <div 
              key={r.id}
              className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 shadow-sm space-y-4 relative flex flex-col justify-between transition-all duration-300 ${
                r.is_flagged 
                  ? 'border-red-200 bg-red-50/10' 
                  : 'border-neutral-100 dark:border-neutral-800'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border">
                      <img 
                        src={r.patientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                        alt={r.patientName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800 dark:text-white text-xs">{r.patientName}</p>
                      <p className="text-[9px] text-neutral-450">{r.patientEmail}</p>
                    </div>
                  </div>

                  {/* Flag indicator */}
                  {r.is_flagged && (
                    <span className="bg-red-50 text-red-750 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border border-red-200">
                      <Flag className="w-2.5 h-2.5 fill-red-650" />
                      <span>Flagged</span>
                    </span>
                  )}
                </div>

                {/* Rating stars & target therapist */}
                <div className="flex items-center justify-between text-xs border-y py-2 dark:border-neutral-800">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < r.rating ? 'fill-amber-400' : 'text-neutral-200 dark:text-neutral-700'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-350 ml-1">
                      {r.rating}.0
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-neutral-500">
                    To: <span className="text-neutral-850 dark:text-neutral-200 font-bold">Dr. {r.doctorName}</span>
                  </p>
                </div>

                {/* Feedback Comment */}
                <div className="bg-neutral-50/50 dark:bg-neutral-850/50 p-3 rounded-xl min-h-[60px]">
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                    "{r.comment || 'No comment provided by patient.'}"
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t dark:border-neutral-800 flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(r.created_at)}</span>
                </span>

                <div className="flex items-center space-x-2">
                  {/* Keep / Approve */}
                  {r.is_flagged && (
                    <button
                      type="button"
                      disabled={loadingId === r.id}
                      onClick={() => handleModeration(r.id, 'keep')}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                      title="Approve / Dismiss Flags"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Flag */}
                  {!r.is_flagged && (
                    <button
                      type="button"
                      disabled={loadingId === r.id}
                      onClick={() => handleModeration(r.id, 'flag')}
                      className="p-1.5 bg-neutral-100 hover:bg-red-50 hover:text-red-750 text-neutral-400 rounded-lg cursor-pointer transition-colors"
                      title="Flag review"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={loadingId === r.id}
                    onClick={() => handleModeration(r.id, 'delete')}
                    className="p-1.5 bg-neutral-100 hover:bg-red-50 hover:text-red-750 text-neutral-400 rounded-lg cursor-pointer transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-neutral-50/50 border border-dashed rounded-2xl text-xs text-neutral-400">
            No patient reviews match your current filters.
          </div>
        )}
      </div>
    </div>
  );
}
