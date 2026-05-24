'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  FileText, 
  ShieldCheck, 
  Ban, 
  Unlock, 
  RefreshCw, 
  Star,
  UserCheck 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { updatePsychiatristVerification, toggleUserSuspension } from '@/actions/admin';

interface Document {
  id: string;
  document_name: string;
  document_url: string;
}

interface Psychiatrist {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  is_suspended: boolean;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  average_rating: number;
  total_sessions: number;
  earnings: number;
  documents: Document[];
}

interface PsychiatristsClientProps {
  psychiatrists: Psychiatrist[];
}

export default function PsychiatristsClient({ psychiatrists }: PsychiatristsClientProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inspector modal states
  const [inspectDoc, setInspectDoc] = useState<Psychiatrist | null>(null);

  const handleVerification = async (doctorId: string, status: 'verified' | 'rejected') => {
    setLoadingId(doctorId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updatePsychiatristVerification(doctorId, status);
      if (res.success) {
        setSuccessMsg(`Psychiatrist verification status updated to ${status}.`);
        setInspectDoc(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update verification status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSuspension = async (doctorId: string, isSuspended: boolean) => {
    const actionText = isSuspended ? 'suspend' : 'unsuspend';
    if (!confirm(`Are you sure you want to ${actionText} this doctor?`)) {
      return;
    }

    setLoadingId(doctorId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await toggleUserSuspension(doctorId, isSuspended);
      if (res.success) {
        setSuccessMsg(`Doctor account suspension set to ${isSuspended}.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update suspension status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Flash notices */}
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

      {/* Directory Table Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-[10px] text-neutral-450 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Doctor Details</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4 text-center">Satisfaction</th>
                <th className="px-6 py-4 text-right">Consultations</th>
                <th className="px-6 py-4 text-right">Earnings</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {psychiatrists.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40">
                  {/* Doctor Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-150 flex-shrink-0">
                        <img src={doc.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250'} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-white text-sm">
                          Dr. {doc.first_name} {doc.last_name}
                        </p>
                        <p className="text-neutral-400 text-[10px] mt-0.5">{doc.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Specialization */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-neutral-700 dark:text-neutral-350">{doc.specialization}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{doc.experience_years} Years Experience</p>
                  </td>

                  {/* Satisfaction Score */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-neutral-800 dark:text-white">{doc.average_rating || '5.0'}</span>
                    </div>
                  </td>

                  {/* Sessions */}
                  <td className="px-6 py-4 text-right font-semibold text-neutral-800 dark:text-neutral-300">
                    {doc.total_sessions} sessions
                  </td>

                  {/* Earnings */}
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {formatCurrency(doc.earnings)}
                  </td>

                  {/* Status Pills */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                      doc.is_suspended
                        ? 'bg-neutral-100 text-neutral-600'
                        : doc.verification_status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : doc.verification_status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-red-50 text-red-705 border border-red-100'
                    }`}>
                      {doc.is_suspended ? 'Suspended' : doc.verification_status}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2.5">
                      {/* Document checker */}
                      <button
                        onClick={() => setInspectDoc(doc)}
                        className="p-2 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
                        title="Review Certificates"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Suspension trigger */}
                      {doc.is_suspended ? (
                        <button
                          disabled={loadingId === doc.id}
                          onClick={() => handleSuspension(doc.id, false)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                          title="Reactivate Clinician"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled={loadingId === doc.id}
                          onClick={() => handleSuspension(doc.id, true)}
                          className="p-2 bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-400 rounded-lg transition-colors cursor-pointer"
                          title="Suspend Clinician"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credential Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl p-6 border border-neutral-100 dark:border-neutral-850 shadow-2xl space-y-6">
            
            {/* Inspector Title */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Credential Inspector: Dr. {inspectDoc.first_name} {inspectDoc.last_name}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Evaluate verification documents and certificates.</p>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document display files */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Uploaded clinical certificates</p>
              {inspectDoc.documents && inspectDoc.documents.length > 0 ? (
                <div className="space-y-3">
                  {inspectDoc.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3 text-neutral-700 dark:text-neutral-300 font-semibold">
                        <FileText className="w-5 h-5 text-red-800" />
                        <span>{doc.document_name}</span>
                      </div>
                      <span className="text-[10px] text-red-800 font-bold flex items-center gap-1">
                        <span>View Document</span>
                        <span>→</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400 bg-neutral-50/50 rounded-xl border">
                  No certificate documents uploaded. Doctor was created via sync fallback.
                </div>
              )}
            </div>

            {/* Verification trigger decisions */}
            <div className="border-t border-neutral-50 dark:border-neutral-850 pt-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Current Verification Status</span>
                <span className="text-xs font-bold capitalize text-neutral-700 dark:text-neutral-350">{inspectDoc.verification_status}</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={loadingId === inspectDoc.id}
                  onClick={() => handleVerification(inspectDoc.id, 'rejected')}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-800" />
                  <span>Reject Credentials</span>
                </button>

                <button
                  type="button"
                  disabled={loadingId === inspectDoc.id}
                  onClick={() => handleVerification(inspectDoc.id, 'verified')}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 text-xs font-semibold rounded-xl transition-all shadow-sm shadow-red-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
