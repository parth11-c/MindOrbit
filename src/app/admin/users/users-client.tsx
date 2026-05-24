'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Ban, 
  Unlock, 
  History, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Clock 
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toggleUserSuspension } from '@/actions/admin';

interface BookingShort {
  id: string;
  scheduled_time: string;
  amount: number;
  status: string;
  doctorName: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'patient' | 'psychiatrist' | 'admin';
  is_suspended: boolean;
  created_at: string;
  bookings: BookingShort[];
}

interface UsersClientProps {
  users: UserProfile[];
}

export default function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inspector modal states
  const [inspectUser, setInspectUser] = useState<UserProfile | null>(null);

  const handleSuspension = async (userId: string, isSuspended: boolean) => {
    const actionText = isSuspended ? 'suspend' : 'unsuspend';
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) {
      return;
    }

    setLoadingId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await toggleUserSuspension(userId, isSuspended);
      if (res.success) {
        setSuccessMsg(`User account suspension status updated.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update user suspension.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-755 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users directory table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-[10px] text-neutral-450 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">User Account</th>
                <th className="px-6 py-4">Account Role</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4 text-center">Booked Sessions</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40">
                  {/* Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-150 flex-shrink-0">
                        <img src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-white text-sm">
                          {u.first_name || 'Anonymous'} {u.last_name || ''}
                        </p>
                        <p className="text-neutral-400 text-[10px] mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-red-50 text-red-700'
                        : u.role === 'psychiatrist'
                        ? 'bg-red-200/60 text-red-700 dark:bg-neutral-800 dark:text-red-400'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-350">
                    {formatDate(u.created_at)}
                  </td>

                  {/* Booking count */}
                  <td className="px-6 py-4 text-center font-semibold text-neutral-800 dark:text-neutral-200">
                    {u.bookings.length} sessions
                  </td>

                  {/* Suspension pill */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                      u.is_suspended
                        ? 'bg-neutral-100 text-neutral-600 border'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {u.is_suspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2.5">
                      {/* Inspect details */}
                      <button
                        onClick={() => setInspectUser(u)}
                        className="p-2 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
                        title="View consultation details"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Suspend controls */}
                      {u.role !== 'admin' && (
                        <>
                          {u.is_suspended ? (
                            <button
                              disabled={loadingId === u.id}
                              onClick={() => handleSuspension(u.id, false)}
                              className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="Reactivate Account"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled={loadingId === u.id}
                              onClick={() => handleSuspension(u.id, true)}
                              className="p-2 bg-neutral-100 hover:bg-red-50 hover:text-red-750 text-neutral-400 rounded-lg transition-colors cursor-pointer"
                              title="Suspend Account"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Inspector Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl p-6 border border-neutral-100 dark:border-neutral-850 shadow-2xl space-y-6">
            
            {/* Title */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Consultations Ledger: {inspectUser.first_name} {inspectUser.last_name}
                </h3>
                <p className="text-[10px] text-neutral-450 mt-0.5">List of psychiatric session records registered to this account.</p>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* List of bookings */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {inspectUser.bookings && inspectUser.bookings.length > 0 ? (
                <div className="space-y-3">
                  {inspectUser.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-neutral-800 dark:text-white text-sm">
                          Dr. {b.doctorName}
                        </p>
                        <p className="text-neutral-450 text-[10px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(b.scheduled_time)}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize block w-fit ml-auto mb-1 ${
                          b.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'booked'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {b.status === 'booked' ? 'Scheduled' : b.status}
                        </span>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">
                          {formatCurrency(b.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-neutral-400 bg-neutral-50/50 border border-dashed rounded-xl">
                  No consultation sessions recorded for this user.
                </div>
              )}
            </div>

            {/* Modal foot actions */}
            <div className="border-t border-neutral-50 dark:border-neutral-850 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectUser(null)}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
