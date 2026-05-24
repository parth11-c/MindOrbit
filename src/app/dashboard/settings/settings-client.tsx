'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, RefreshCw, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import { updateUserRole } from '@/actions/sync-user';
import { SignOutButton } from '@clerk/nextjs';

interface SettingsClientProps {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  currentRole: 'patient' | 'psychiatrist' | 'admin';
}

export default function SettingsClient({
  userId,
  email,
  firstName,
  lastName,
  avatarUrl,
  currentRole,
}: SettingsClientProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'psychiatrist' | 'admin'>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRoleChange = async () => {
    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateUserRole(userId, selectedRole);
      if (res.success) {
        setSuccessMsg(`Account role updated to "${selectedRole}" successfully.`);
        
        // Redirect based on updated role
        setTimeout(() => {
          if (selectedRole === 'patient') {
            router.push('/dashboard');
          } else if (selectedRole === 'psychiatrist') {
            router.push('/psychiatrist');
          } else if (selectedRole === 'admin') {
            router.push('/admin');
          }
          router.refresh();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Failed to update user role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during update.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-755 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          <span>{successMsg} Redirecting to your new dashboard...</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white border-b pb-4 dark:border-neutral-800 flex items-center gap-2">
          <User className="w-5 h-5 text-red-800" />
          <span>Profile Information</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
            <img src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-300 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase">First Name</p>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm mt-0.5">{firstName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase">Last Name</p>
                <p className="font-semibold text-neutral-900 dark:text-white text-sm mt-0.5">{lastName || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase">Email Address</p>
              <p className="font-semibold text-neutral-900 dark:text-white text-sm mt-0.5">{email}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-50 dark:border-neutral-850 pt-4 flex justify-end">
          <div className="bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 text-neutral-700 dark:text-neutral-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
            <LogOut className="w-4 h-4 text-neutral-450" />
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Developer testing / Role Switcher Card */}
      <div className="bg-white dark:bg-neutral-900 border border-red-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white border-b pb-4 dark:border-neutral-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-800" />
          <span>Developer Sandbox: Role Switcher</span>
        </h2>
        
        <p className="text-xs text-neutral-500 leading-relaxed">
          MindOrbit includes role-based authorization blocks (Patient Portal, Psychiatrist Clinical Dashboard, Enterprise Admin Dashboard). Use this developer switch to immediately toggle your Clerk profile's metadata role in Supabase.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          {(['patient', 'psychiatrist', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedRole === role
                  ? 'border-red-600 bg-red-50/20 text-red-750 shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {role === 'patient' ? 'Patient / User' : role === 'psychiatrist' ? 'Psychiatrist Doctor' : 'Admin Operations'}
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-50 dark:border-neutral-850 pt-5 flex items-center justify-between gap-4">
          <p className="text-[10px] text-neutral-450 font-medium">
            Active session role in Supabase: <span className="font-bold text-neutral-700 dark:text-neutral-300 capitalize">{currentRole}</span>
          </p>
          
          <button
            onClick={handleRoleChange}
            disabled={isUpdating || selectedRole === currentRole}
            className={`bg-red-650 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
              selectedRole === currentRole ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Switch Role</span>
          </button>
        </div>
      </div>
    </div>
  );
}
