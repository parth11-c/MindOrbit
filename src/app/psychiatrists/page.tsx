import { createAdminClient } from '@/lib/supabase/server';
import DoctorExplorerClient from './doctor-explorer-client';

const MOCK_SPECIALIZATIONS = [
  { id: 'spec1', name: 'Clinical Psychiatry' },
  { id: 'spec2', name: 'Child & Adolescent Psychiatry' },
  { id: 'spec3', name: 'Addiction Psychiatry' },
  { id: 'spec4', name: 'Geriatric Psychiatry' },
  { id: 'spec5', name: 'Forensic Psychiatry' },
];

const MOCK_DOCTORS = [
  {
    id: 'doc1',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
    specialization_id: 'spec1',
    specialization_name: 'Clinical Psychiatry',
    experience_years: 12,
    consultation_fee: 1500,
    average_rating: 4.90,
    gender: 'female',
    languages: ['English', 'Spanish'],
    bio: 'Dedicated clinical psychiatrist specialized in CBT therapies, major depressive disorders, and cognitive counseling with 12 years of hands-on experience.',
    verification_status: 'verified',
  },
  {
    id: 'doc2',
    first_name: 'Amit',
    last_name: 'Patel',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
    specialization_id: 'spec2',
    specialization_name: 'Child & Adolescent Psychiatry',
    experience_years: 9,
    consultation_fee: 1800,
    average_rating: 4.80,
    gender: 'male',
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Specialist child therapist focused on learning difficulties, adolescent adjustment, and developmental counseling in secure online sessions.',
    verification_status: 'verified',
  },
  {
    id: 'doc3',
    first_name: 'Elena',
    last_name: 'Rostova',
    avatar_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250',
    specialization_id: 'spec3',
    specialization_name: 'Addiction Psychiatry',
    experience_years: 15,
    consultation_fee: 2200,
    average_rating: 4.95,
    gender: 'female',
    languages: ['English', 'Russian'],
    bio: 'Providing comprehensive addiction consultation and medical support for cognitive recovery, dependency relief, and behavioral rehab.',
    verification_status: 'verified',
  },
  {
    id: 'doc4',
    first_name: 'David',
    last_name: 'Miller',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250',
    specialization_id: 'spec4',
    specialization_name: 'Geriatric Psychiatry',
    experience_years: 18,
    consultation_fee: 2500,
    average_rating: 4.92,
    gender: 'male',
    languages: ['English', 'German'],
    bio: 'Specialized in geriatric care, addressing cognitive memory challenges, age-associated anxieties, and mental health counseling for senior citizens.',
    verification_status: 'verified',
  },
];

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
    } else {
      specializations = MOCK_SPECIALIZATIONS;
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

    if (isSandbox) {
      // Sandbox: show verified + pending (not rejected)
      query = query.in('verification_status', ['verified', 'pending']) as any;
    } else {
      // Production: only show verified doctors
      query = query.eq('verification_status', 'verified') as any;
    }

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
    } else {
      // Only fall back to mock data when the DB query itself errored out.
      console.error('Psychiatrists query error, falling back to mock data:', docsError);
      doctors = MOCK_DOCTORS;
    }
  } catch (err) {
    console.error('Error fetching psychiatrists page database records:', err);
    doctors = MOCK_DOCTORS;
    specializations = MOCK_SPECIALIZATIONS;
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
