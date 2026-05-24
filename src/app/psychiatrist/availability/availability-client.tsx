'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAvailabilitySlots, deleteAvailabilitySlot } from '@/actions/psychiatrist';
import { Calendar as CalendarIcon, Clock, Trash2, Plus, CalendarRange, Loader2, Info } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface AvailabilityClientProps {
  initialSlots: Slot[];
  isVerified: boolean;
}

export default function AvailabilityClient({ initialSlots, isVerified }: AvailabilityClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setError('Only verified psychiatrists can generate availability slots.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

      if (startDateTime.getTime() <= Date.now()) {
        throw new Error('Timeslot cannot be scheduled in the past.');
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new Error('End time must occur after start time.');
      }

      const diffMins = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
      if (diffMins < 30) {
        throw new Error('Minimum session slot duration is 30 minutes.');
      }

      const res = await createAvailabilitySlots([
        {
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
        },
      ]);

      if (res.success) {
        router.refresh();
      } else {
        throw new Error(res.error || 'Failed to create availability slot.');
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    setDeletingId(slotId);
    try {
      const res = await deleteAvailabilitySlot(slotId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete slot.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot.');
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by date
  const groupedSlots: { [key: string]: Slot[] } = {};
  initialSlots.forEach((slot) => {
    const dKey = new Date(slot.start_time).toDateString();
    if (!groupedSlots[dKey]) {
      groupedSlots[dKey] = [];
    }
    groupedSlots[dKey].push(slot);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Add Slot Control Panel (Left column) */}
      <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-red-800" />
            <span>Generate Slot</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Open a new consultation slot for patient scheduling.</p>
        </div>

        {!isVerified ? (
          <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl text-xs font-semibold text-amber-700 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Your profile is pending verification. Unverified doctors cannot create booking slots. Please submit credentials on the profile tab.</span>
          </div>
        ) : (
          <form onSubmit={handleAddSlot} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs font-semibold text-red-750">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-250 text-neutral-900 dark:text-neutral-950 font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Timeslot</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Slots List (Right column) */}
      <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm min-h-[300px]">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Active Timeslots</h2>
          <p className="text-xs text-neutral-400 mt-1">Review your scheduled slots and booked consultations.</p>
        </div>

        {initialSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-neutral-500">
            <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
            <span>No slots generated yet. Add your first slot on the left.</span>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {Object.entries(groupedSlots).map(([day, daySlots]) => (
              <div key={day} className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b pb-1 dark:border-neutral-800">
                  {formatDate(day)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                        slot.is_booked
                          ? 'border-emerald-100 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/10'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-205">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {slot.is_booked ? (
                          <span className="font-bold uppercase text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded">
                            Booked
                          </span>
                        ) : (
                          <>
                            <span className="text-[10px] font-semibold text-neutral-400">Available</span>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              className="text-neutral-400 hover:text-red-600 transition-colors"
                              title="Delete Timeslot"
                            >
                              {deletingId === slot.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
