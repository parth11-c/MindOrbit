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
    } else if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
      // Load standard sandbox clinical accounts if db is empty
      psychiatrists = [
        {
          id: 'doc1',
          email: 'sarah.jenkins@mindorbit.com',
          first_name: 'Sarah',
          last_name: 'Jenkins',
          avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
          is_suspended: false,
          specialization: 'Clinical Psychiatry',
          experience_years: 12,
          consultation_fee: 1500,
          verification_status: 'verified',
          average_rating: 4.9,
          total_sessions: 42,
          earnings: 53550,
          documents: [
            {
              id: 'doc-cert-1',
              document_name: 'Medical License Certificate.pdf',
              document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            },
          ],
        },
        {
          id: 'doc2',
          email: 'amit.patel@mindorbit.com',
          first_name: 'Amit',
          last_name: 'Patel',
          avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
          is_suspended: false,
          specialization: 'Child & Adolescent Psychiatry',
          experience_years: 9,
          consultation_fee: 1800,
          verification_status: 'pending',
          average_rating: 4.8,
          total_sessions: 15,
          earnings: 22950,
          documents: [
            {
              id: 'doc-cert-2',
              document_name: 'Board Certification Pediatric.pdf',
              document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            },
          ],
        },
        {
          id: 'doc3',
          email: 'elena.rostova@mindorbit.com',
          first_name: 'Elena',
          last_name: 'Rostova',
          avatar_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250',
          is_suspended: true,
          specialization: 'Addiction Psychiatry',
          experience_years: 15,
          consultation_fee: 2200,
          verification_status: 'verified',
          average_rating: 4.95,
          total_sessions: 56,
          earnings: 104720,
          documents: [],
        },
      ];
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
