'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Percent, 
  Mail, 
  Megaphone, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Stethoscope,
  Loader2,
  FileText
} from 'lucide-react';
import { updateSystemSettings, createSpecialization } from '@/actions/admin';

interface SpecializationItem {
  id: string;
  name: string;
  description: string;
}

interface SettingsClientProps {
  initialCommission: number;
  initialSupportEmail: string;
  initialAnnouncement: string;
  specializations: SpecializationItem[];
}

export default function SettingsClient({
  initialCommission,
  initialSupportEmail,
  initialAnnouncement,
  specializations,
}: SettingsClientProps) {
  const router = useRouter();

  // General Settings States
  const [commissionPercent, setCommissionPercent] = useState(initialCommission);
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Specialization Adder States
  const [specName, setSpecName] = useState('');
  const [specDesc, setSpecDesc] = useState('');
  const [specLoading, setSpecLoading] = useState(false);

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateSystemSettings({
        commissionPercent,
        supportEmail,
        announcement,
      });

      if (res.success) {
        setSuccessMsg('Global system settings updated successfully.');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update system settings.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateSpecialization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specName.trim()) {
      setErrorMsg('Specialization classification name is required.');
      return;
    }

    setSpecLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await createSpecialization(specName, specDesc);

      if (res.success) {
        setSuccessMsg(`Specialization "${specName}" added to the platform directory.`);
        setSpecName('');
        setSpecDesc('');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to create specialization category.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSpecLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: System Configurations Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-neutral-800 dark:text-white uppercase tracking-wider">
                Global Platform Configurations
              </h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Configure commission parameters, contact channels, and system marquee banners.
              </p>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-5">
              {/* Commission cut */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Platform Commission Percentage (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650 font-semibold"
                    required
                  />
                </div>
                <p className="text-[9px] text-neutral-400">
                  The cut percentage the platform deducts from doctor consultation fees. (e.g. 15 means psychiatrist receives 85% of fee).
                </p>
              </div>

              {/* Support Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Platform Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                    required
                  />
                </div>
                <p className="text-[9px] text-neutral-400">
                  Contact address displayed to users for refund claims or complaints.
                </p>
              </div>

              {/* Marquee Banner Announcement */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Homepage Announcement Banner Notice
                </label>
                <div className="relative">
                  <Megaphone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                  <textarea
                    rows={3}
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                    required
                  />
                </div>
                <p className="text-[9px] text-neutral-400">
                  A warning, welcome message, or general notice shown at the top of the patient homepage.
                </p>
              </div>

              <div className="pt-2 border-t dark:border-neutral-800 flex justify-end">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-6 py-2.5 bg-red-650 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-1.5"
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving settings...</span>
                    </>
                  ) : (
                    <span>Save Platform Config</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Specialization Adder & List */}
        <div className="space-y-6">
          {/* Create Specialization */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-neutral-800 dark:text-white uppercase tracking-wider">
                Add Specialization Category
              </h2>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Register new clinical categories for doctor profile tagging.
              </p>
            </div>

            <form onSubmit={handleCreateSpecialization} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-neutral-750 dark:text-neutral-300">
                  Classification Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Neuropsychiatry"
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-neutral-750 dark:text-neutral-300">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Focus areas, conditions diagnosed..."
                  value={specDesc}
                  onChange={(e) => setSpecDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-neutral-50/50 dark:bg-neutral-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                />
              </div>

              <button
                type="submit"
                disabled={specLoading}
                className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center space-x-1.5"
              >
                {specLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Specialization</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List Specializations */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-neutral-800 dark:text-white uppercase tracking-wider">
                Configured Classifications ({specializations.length})
              </h3>
              <p className="text-[9px] text-neutral-450 mt-0.5">
                Current clinical specializations available for booking discovery search.
              </p>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {specializations.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200/50 dark:border-neutral-800 text-xs space-y-1"
                >
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-800 dark:text-white">
                    <Stethoscope className="w-3.5 h-3.5 text-red-800 flex-shrink-0" />
                    <span>{s.name}</span>
                  </div>
                  {s.description && (
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
