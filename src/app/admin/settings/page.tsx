import { createAdminClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';

export const metadata = {
  title: 'Platform Configs & Settings - MindOrbit Admin',
  description: 'Manage platform commission cuts, support email details, public announcements, and list specialization tags.',
};

export default async function AdminSettingsPage() {
  const adminDb = createAdminClient();

  let commissionPercent = 15;
  let supportEmail = 'support@mindorbit.com';
  let announcement = 'Welcome to MindOrbit! Consult certified psychiatric professionals online.';
  let specializations: any[] = [];

  try {
    // 1. Query settings
    const { data: dbSettings, error: settingsErr } = await adminDb
      .from('system_settings')
      .select('key, value');

    if (!settingsErr && dbSettings) {
      const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));
      if (settingsMap.has('platform_commission_percent')) {
        commissionPercent = Number(settingsMap.get('platform_commission_percent') || 15);
      }
      if (settingsMap.has('support_email')) {
        supportEmail = settingsMap.get('support_email') || 'support@mindorbit.com';
      }
      if (settingsMap.has('announcement')) {
        announcement = settingsMap.get('announcement') || '';
      }
    }

    // 2. Query specializations
    const { data: dbSpecializations, error: specErr } = await adminDb
      .from('specializations')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (!specErr && dbSpecializations && dbSpecializations.length > 0) {
      specializations = dbSpecializations;
    } else if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
      specializations = [
        {
          id: 's1',
          name: 'Clinical Psychiatry',
          description: 'Diagnosis, treatment and prevention of mental, emotional and behavioral disorders.',
        },
        {
          id: 's2',
          name: 'Child & Adolescent Psychiatry',
          description: 'Specialized mental healthcare for children, teenagers and their families.',
        },
        {
          id: 's3',
          name: 'Addiction Psychiatry',
          description: 'Support and clinical therapy for individuals struggling with substance abuse and behavioral addictions.',
        },
        {
          id: 's4',
          name: 'Geriatric Psychiatry',
          description: 'Mental healthcare addressing cognitive disorders and mental health issues in older adults.',
        },
        {
          id: 's5',
          name: 'Forensic Psychiatry',
          description: 'Intersection of mental health and the law, including expert evaluation and legal testimony.',
        }
      ];
    }
  } catch (err) {
    console.error('Error fetching admin system settings:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          System Control Panel
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Adjust platform commission parameters, update notice banners, and edit available therapy specializations.
        </p>
      </div>

      <SettingsClient
        initialCommission={commissionPercent}
        initialSupportEmail={supportEmail}
        initialAnnouncement={announcement}
        specializations={specializations}
      />
    </div>
  );
}
