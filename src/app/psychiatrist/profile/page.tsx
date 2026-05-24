import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import ProfileEditorForm from './profile-editor-form';

export const metadata = {
  title: 'Clinician Onboarding & Profile - MindOrbit',
  description: 'Manage your psychiatric consultation settings, languages spoken, session fees, and verify medical license files.',
};

export default async function PsychiatristProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const adminDb = createAdminClient();

  // 1. Fetch specializations list
  let { data: specializations, error: specsErr } = await adminDb
    .from('specializations')
    .select('id, name')
    .order('name');

  if (!specializations || specializations.length === 0) {
    const defaultSpecs = [
      { name: 'Clinical Psychiatry', description: 'Diagnosis, treatment and prevention of mental, emotional and behavioral disorders.' },
      { name: 'Child & Adolescent Psychiatry', description: 'Specialized mental healthcare for children, teenagers and their families.' },
      { name: 'Addiction Psychiatry', description: 'Support and clinical therapy for individuals struggling with substance abuse and behavioral addictions.' },
      { name: 'Geriatric Psychiatry', description: 'Mental healthcare addressing cognitive disorders and mental health issues in older adults.' },
      { name: 'Forensic Psychiatry', description: 'Intersection of mental health and the law, including expert evaluation and legal testimony.' }
    ];
    await adminDb.from('specializations').insert(defaultSpecs);

    const { data: refetched } = await adminDb
      .from('specializations')
      .select('id, name')
      .order('name');
    specializations = refetched;
  }

  // 2. Fetch user identity details
  const { data: dbUser } = await adminDb
    .from('users')
    .select('first_name, last_name, avatar_url')
    .eq('id', clerkUser.id)
    .single();

  // 3. Fetch psychiatrist settings
  const { data: doctor, error: docErr } = await adminDb
    .from('psychiatrists')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  // 4. Fetch uploaded verification documents
  const { data: documents } = await adminDb
    .from('psychiatrist_documents')
    .select('*')
    .eq('psychiatrist_id', clerkUser.id)
    .order('uploaded_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Onboarding & Profile Editor</h1>
        <p className="text-xs text-neutral-400 mt-1">Configure your clinical dashboard settings, pricing, and upload verification license files.</p>
      </div>

      <ProfileEditorForm
        specializations={specializations || []}
        initialProfile={doctor || null}
        initialUser={dbUser ? {
          firstName: dbUser.first_name || '',
          lastName: dbUser.last_name || '',
          avatarUrl: dbUser.avatar_url || '',
        } : null}
        documents={documents || []}
      />
    </div>
  );
}
