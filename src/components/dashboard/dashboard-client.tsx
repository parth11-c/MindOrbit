'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Video, Clock, ArrowRight, ShieldCheck, Bell, MessageSquare, Plus } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface Booking {
  id: string;
  scheduled_time: string;
  amount: number;
  status: string;
  payment_status: string;
  approval_status: string;
  doctor: {
    id: string;
    name: string;
    specialization: string;
    avatar_url?: string;
  };
}

interface Notification {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardClientProps {
  upcomingBookings: Booking[];
  notifications: Notification[];
  userName: string;
}

export default function DashboardClient({
  upcomingBookings,
  notifications,
  userName,
}: DashboardClientProps) {

  return (
    <div className="space-y-8">
      {/* 1. Header welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Check your consultation schedule, access joining links, or browse specialized doctors.
          </p>
        </div>
        <Link
          href="/psychiatrists"
          className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-red-500/5 hover-lift"
        >
          <Plus className="w-4 h-4" />
          <span>Book a Session</span>
        </Link>
      </div>

      {/* 2. Top Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Scheduled Sessions</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">{upcomingBookings.length} Upcoming</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">In-App Notices</p>
            <p className="text-xl font-bold text-neutral-950 dark:text-white mt-0.5">
              {notifications.filter((n) => !n.is_read).length} Unread
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Security Level</p>
            <p className="text-sm font-bold text-neutral-950 dark:text-white mt-1">100% HIPAA Safe</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Upcoming Bookings column */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 dark:border-neutral-800">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-red-800" />
              <span>Upcoming Consultation Links</span>
            </h2>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-red-800 hover:text-red-750 flex items-center gap-1"
            >
              <span>View full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-neutral-100 dark:border-neutral-800 bg-neutral-50/20 p-5 rounded-2xl gap-4 text-xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={booking.doctor.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250'}
                        alt={booking.doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800 dark:text-white text-sm">
                        {booking.doctor.name}
                      </p>
                      <p className="text-neutral-400 text-[10px] uppercase font-semibold mt-0.5">
                        {booking.doctor.specialization}
                      </p>
                      <div className="flex items-center gap-3 text-neutral-500 text-[10px] mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-450" />
                          <span>{formatTime(booking.scheduled_time)}</span>
                        </span>
                        <span>•</span>
                        <span className="font-semibold">{formatDate(booking.scheduled_time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-neutral-450">Paid Fee</p>
                      <p className="font-bold text-neutral-855 dark:text-white mt-0.5">
                        {formatCurrency(booking.amount)}
                      </p>
                    </div>

                    {booking.approval_status === 'pending' ? (
                      <button
                        disabled
                        className="bg-amber-50 border border-amber-250 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Pending Approval</span>
                      </button>
                    ) : (
                      <Link
                        href={`/session/${booking.id}`}
                        className="bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-red-500/10 hover-lift flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Session</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-neutral-550 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-4">
              <Calendar className="w-8 h-8 mx-auto text-neutral-350" />
              <div className="space-y-1">
                <p className="font-bold text-neutral-800">No consultations booked</p>
                <p className="text-neutral-400">Discover our certified psychiatrists to schedule your first therapy session.</p>
              </div>
              <Link
                href="/psychiatrists"
                className="inline-block bg-red-650 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors mt-2"
              >
                Find a Psychiatrist
              </Link>
            </div>
          )}
        </div>

        {/* 4. Side Alerts / Notifications column */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b pb-4 dark:border-neutral-800">
            <Bell className="w-5 h-5 text-red-800 animate-pulse" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Recent Alerts</h2>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-colors text-xs space-y-1 ${
                    notif.is_read
                      ? 'bg-neutral-50/50 dark:bg-neutral-850/50 border-neutral-100 dark:border-neutral-800 text-neutral-500'
                      : 'bg-red-50/10 dark:bg-red-950/5 border-red-100/50 dark:border-red-900/10 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-white mb-0.5">
                    <span className="truncate max-w-[150px]">{notif.title}</span>
                    <span className="text-[9px] text-neutral-400 font-medium font-mono">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {notif.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-neutral-400 space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto text-neutral-350" />
              <p>No recent alerts or reminders.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
