import { createAdminClient } from '@/lib/supabase/server';
import DoctorExplorerClient from './doctor-explorer-client';

export const metadata = {
  title: 'Find & Browse Psychiatrists - MindOrbit',
  description: 'Search and filter leading certified psychiatrists by specialization, language, consultation fee, gender, and experience.',
};

export default async function PsychiatristsPage() {
  let doctors: any[] = [];
  let specializations: any[] = [];
  // In sandbox mode show verified + pending so newly onboarded doctors appear instantly.
  const isSandbox = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

  try {
    const supabase = createAdminClient();

    // Fetch specializations
    const { data: specsData, error: specsError } = await supabase
      .from('specializations')
      .select('id, name')
      .order('name');

    if (specsData && !specsError) {
      specializations = specsData;
    }

    // Build the query. In sandbox include pending so new doctors are visible immediately.
    let query = supabase
      .from('psychiatrists')
      .select(`
        id,
        experience_years,
        consultation_fee,
        average_rating,
        gender,
        languages_spoken,
        bio,
        verification_status,
        users (
          first_name,
          last_name,
          avatar_url
        ),
        specializations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Only show verified (approved) doctors in the feed for booking
    query = query.eq('verification_status', 'verified') as any;

    const { data: docsData, error: docsError } = await query;

    if (!docsError && docsData) {
      // Map real doctors — even if the list is empty, do NOT fall through to mock data.
      doctors = docsData.map((doc: any) => ({
        id: doc.id,
        first_name: doc.users?.first_name || '',
        last_name: doc.users?.last_name || '',
        avatar_url:
          doc.users?.avatar_url ||
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250',
        specialization_id: doc.specializations?.id || '',
        specialization_name: doc.specializations?.name || 'Psychiatrist',
        experience_years: doc.experience_years,
        consultation_fee: Number(doc.consultation_fee),
        // Keep genuine 0 rating — card component will display "New" instead of 0
        average_rating: Number(doc.average_rating) || 0,
        gender: doc.gender || 'unspecified',
        languages: doc.languages_spoken || ['English'],
        bio: doc.bio || '',
        verification_status: doc.verification_status,
      }));
    }
  } catch (err) {
    console.error('Error fetching psychiatrists page database records:', err);
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <DoctorExplorerClient
        initialDoctors={doctors}
        specializations={specializations}
        isSandbox={isSandbox}
      />
    </div>
  );
}
