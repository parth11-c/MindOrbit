'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Filter,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { adminInterveneBooking } from '@/actions/admin';

export interface BookingAdminDetail {
  id: string;
  patient_id: string;
  patientName: string;
  patientEmail: string;
  patientAvatar?: string;
  psychiatrist_id: string;
  doctorName: string;
  doctorEmail: string;
  scheduled_time: string;
  amount: number;
  commission_amount: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: string;
  payment_status: string;
  approval_status: string;
  created_at: string;
}

interface BookingsClientProps {
  bookings: BookingAdminDetail[];
}

export default function BookingsClient({ bookings }: BookingsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingAdminDetail | null>(null);

  // Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleIntervention = async (bookingId: string, actionType: 'cancel_refund' | 'complete') => {
    const actionText = actionType === 'cancel_refund' 
      ? 'FORCE CANCEL & REFUND' 
      : 'FORCE SET COMPLETE';

    if (!confirm(`WARNING: You are about to manually intervene in this dispute.\nAre you sure you want to ${actionText} this booking?`)) {
      return;
    }

    setLoadingId(bookingId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminInterveneBooking(bookingId, actionType);
      if (res.success) {
        setSuccessMsg(`Dispute action "${actionText}" processed successfully.`);
        router.refresh();
        // Update local modal view if open
        if (selectedBooking && selectedBooking.id === bookingId) {
          const updated = bookings.find((b) => b.id === bookingId);
          if (updated) setSelectedBooking({
            ...updated,
            status: actionType === 'complete' ? 'completed' : 'cancelled',
            payment_status: actionType === 'complete' ? updated.payment_status : 'refunded'
          });
        }
      } else {
        setErrorMsg(res.error || 'Intervention action failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during transaction modification.');
    } finally {
      setLoadingId(null);
    }
  };

  // Calculations
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.razorpay_payment_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.razorpay_order_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || b.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalRevenue = bookings.reduce((sum, b) => b.payment_status === 'paid' ? sum + b.amount : sum, 0);
  const platformEarnings = bookings.reduce((sum, b) => b.payment_status === 'paid' ? sum + b.commission_amount : sum, 0);
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-450">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales Ledger</span>
            <DollarSign className="w-4 h-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-800 dark:text-white">
            {formatCurrency(totalRevenue)}
          </h3>
          <p className="text-[10px] text-neutral-400">Sum of all user-paid clinical session values</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-450">
            <span className="text-[10px] font-bold uppercase tracking-wider">Platform Take Cut</span>
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-800 text-[9px] font-bold">Commission</span>
          </div>
          <h3 className="text-2xl font-bold text-red-800">
            {formatCurrency(platformEarnings)}
          </h3>
          <p className="text-[10px] text-neutral-400">Total fees credited to administrative account</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-450">
            <span className="text-[10px] font-bold uppercase tracking-wider">Session Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600">
            {completedCount} <span className="text-xs text-neutral-450 font-medium">completed</span>
          </h3>
          <p className="text-[10px] text-neutral-400">Successfully rendered psychiatry hours</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-450">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cancellation / Refunds</span>
            <XCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            {cancelledCount} <span className="text-xs text-neutral-450 font-medium">cancelled</span>
          </h3>
          <p className="text-[10px] text-neutral-400">Appointments terminated by user/admin</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Patient, Psychiatrist, Razorpay Order ID or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <div className="flex items-center space-x-1.5 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 bg-white dark:bg-neutral-850">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Session States</option>
              <option value="booked">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending_payment">Pending Payment</option>
            </select>
          </div>

          {/* Payment */}
          <div className="flex items-center space-x-1.5 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 bg-white dark:bg-neutral-850">
            <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-600 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Payment States</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reservation Ledger Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-neutral-500 dark:text-neutral-400">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-[10px] text-neutral-450 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Patient Account</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Scheduled Date</th>
                <th className="px-6 py-4 text-center">Amount Paid</th>
                <th className="px-6 py-4 text-center">Platform Fee</th>
                <th className="px-6 py-4 text-center">Session State</th>
                <th className="px-6 py-4 text-center">Payment State</th>
                <th className="px-6 py-4 text-center rounded-r-xl">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/40">
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-150 flex-shrink-0">
                          <img 
                            src={b.patientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                            alt={b.patientName} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-800 dark:text-white text-xs">{b.patientName}</p>
                          <p className="text-[9px] text-neutral-450">{b.patientEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-white text-xs">Dr. {b.doctorName}</p>
                        <p className="text-[9px] text-neutral-450">{b.doctorEmail}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-350 font-medium">
                      {formatDate(b.scheduled_time)}
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-center font-bold text-neutral-800 dark:text-neutral-200">
                      {formatCurrency(b.amount)}
                    </td>

                    {/* Platform Cut */}
                    <td className="px-6 py-4 text-center text-red-800 font-semibold">
                      {formatCurrency(b.commission_amount)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        b.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.status === 'booked'
                          ? b.approval_status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700'
                          : b.status === 'cancelled'
                          ? 'bg-neutral-100 text-neutral-600 border'
                          : 'bg-yellow-50 text-yellow-750'
                      }`}>
                        {b.status === 'booked'
                          ? b.approval_status === 'pending'
                            ? 'Pending Approval'
                            : 'Approved & Scheduled'
                          : b.status}
                      </span>
                    </td>

                    {/* Payment Status badge */}
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : b.payment_status === 'refunded'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : b.payment_status === 'failed'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-yellow-50 text-yellow-750'
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded-lg cursor-pointer transition-colors"
                          title="View Payment & Transaction details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-neutral-400 bg-neutral-50/50">
                    No matching booking logs could be found in the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl p-6 border border-neutral-100 dark:border-neutral-850 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
              <div>
                <h3 className="font-extrabold text-neutral-900 dark:text-white text-base">
                  Reservation Audit: #{selectedBooking.id.substring(0, 8)}
                </h3>
                <p className="text-[10px] text-neutral-450 mt-0.5">Comprehensive Razorpay log and dispute controls.</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-neutral-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content info grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl">
                <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Patient</p>
                <p className="font-bold text-neutral-800 dark:text-white">{selectedBooking.patientName}</p>
                <p className="text-[9px] text-neutral-400">{selectedBooking.patientEmail}</p>
              </div>

              <div className="space-y-1 p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl">
                <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Psychiatrist</p>
                <p className="font-bold text-neutral-800 dark:text-white">Dr. {selectedBooking.doctorName}</p>
                <p className="text-[9px] text-neutral-400">{selectedBooking.doctorEmail}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Scheduled Timing</p>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                  {formatDate(selectedBooking.scheduled_time)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Approval Status</p>
                <p className="font-medium">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    selectedBooking.approval_status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : selectedBooking.approval_status === 'rejected'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedBooking.approval_status}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-neutral-450 font-bold uppercase tracking-wider">Created Timestamp</p>
                <p className="font-medium text-neutral-800 dark:text-neutral-200">
                  {formatDate(selectedBooking.created_at)}
                </p>
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2.5">
              <h4 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Financial Breakdown</h4>
              <div className="bg-neutral-50 dark:bg-neutral-850 border rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gross Patient Paid Fee:</span>
                  <span className="font-bold text-neutral-800 dark:text-white">
                    {formatCurrency(selectedBooking.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-red-800">
                  <span className="font-medium">Platform Commission Deduct:</span>
                  <span className="font-bold">
                    -{formatCurrency(selectedBooking.commission_amount)}
                  </span>
                </div>
                <div className="border-t border-neutral-200/50 pt-2 flex justify-between font-bold text-neutral-900 dark:text-white text-sm">
                  <span>Therapist Net Earnings:</span>
                  <span>
                    {formatCurrency(Number((selectedBooking.amount - selectedBooking.commission_amount).toFixed(2)))}
                  </span>
                </div>
              </div>
            </div>

            {/* Gateway Details */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider">Razorpay Gateway Records</h4>
              <div className="space-y-1.5 text-[11px] font-mono bg-neutral-900 text-neutral-300 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-neutral-500">ORDER_ID:</span>
                  <span>{selectedBooking.razorpay_order_id || 'MOCK_ORDER_ID_XXXX'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">PAYMENT_ID:</span>
                  <span>{selectedBooking.razorpay_payment_id || 'MOCK_PAYMENT_ID_XXXX'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">GATEWAY:</span>
                  <span className="text-red-400 font-bold uppercase">Razorpay Sandbox</span>
                </div>
              </div>
            </div>

            {/* Dispute Control / Dispute Actions */}
            {selectedBooking.status !== 'cancelled' && (
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-3">
                <div className="flex items-start space-x-2 bg-yellow-50 dark:bg-yellow-950/40 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900 text-[11px] text-yellow-750">
                  <HelpCircle className="w-4 h-4 flex-shrink-0 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Administrative Intervention</p>
                    <p className="mt-0.5 text-neutral-500">
                      As an admin, you can override scheduled reservations to refund patients or forcefully close disputed therapy hours. This adjusts therapist ledger records instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedBooking.status !== 'completed' && (
                    <button
                      type="button"
                      disabled={loadingId === selectedBooking.id}
                      onClick={() => handleIntervention(selectedBooking.id, 'complete')}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {loadingId === selectedBooking.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Force Complete Session</span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={loadingId === selectedBooking.id}
                    onClick={() => handleIntervention(selectedBooking.id, 'cancel_refund')}
                    className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-750 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {loadingId === selectedBooking.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Force Refund & Cancel</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
