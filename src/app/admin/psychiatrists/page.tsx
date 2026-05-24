import { createAdminClient } from '@/lib/supabase/server';
import PsychiatristsClient from './psychiatrists-client';

export const metadata = {
  title: 'Psychiatrist Onboarding & Verifications - MindOrbit Admin',
  description: 'Review clinical psychiatrist licenses, verify documents, approve clinician onboarding, or suspend therapist accounts.',
};

export default async function AdminPsychiatristsPage() {
  const adminDb = createAdminClient();

  let psychiatrists: any[] = [];
  try {
    // 1. Query all users who are psychiatrists
    const { data: dbUsers, error } = await adminDb
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        avatar_url,
        is_suspended,
        psychiatrists (
          experience_years,
          consultation_fee,
          verification_status,
          average_rating,
          total_sessions,
          earnings,
          specializations (
            name
          )
        )
      `)
      .eq('role', 'psychiatrist');

    // 2. Query documents
    const { data: dbDocs } = await adminDb
      .from('psychiatrist_documents')
      .select('*');

    const docsMap: { [key: string]: any[] } = {};
    dbDocs?.forEach((doc) => {
      if (!docsMap[doc.psychiatrist_id]) docsMap[doc.psychiatrist_id] = [];
      docsMap[doc.psychiatrist_id].push({
        id: doc.id,
        document_name: doc.document_name,
        document_url: doc.document_url,
      });
    });

    if (!error && dbUsers && dbUsers.length > 0) {
      psychiatrists = dbUsers.map((user: any) => {
        // Handle single or array structures from Supabase relations
        const docRecord = Array.isArray(user.psychiatrists) 
          ? user.psychiatrists[0] 
          : user.psychiatrists;
        const details = docRecord || {};

        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          avatar_url: user.avatar_url,
          is_suspended: user.is_suspended,
          specialization: details.specializations?.name || 'Clinical Psychiatry',
          experience_years: details.experience_years || 0,
          consultation_fee: Number(details.consultation_fee || 500),
          verification_status: details.verification_status || 'pending',
          average_rating: Number(details.average_rating || 0.0),
          total_sessions: details.total_sessions || 0,
          earnings: Number(details.earnings || 0),
          documents: docsMap[user.id] || [],
        };
      });
    }
  } catch (err) {
    console.error('Error fetching admin psychiatrists listings:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Psychiatrist Controls
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review practitioner licensing certificates, edit verification status, or apply platform suspensions.
        </p>
      </div>

      <PsychiatristsClient psychiatrists={psychiatrists} />
    </div>
  );
}
