import { createAdminClient } from '@/lib/supabase/server';
import ReviewsClient, { ReviewAdminDetail } from './reviews-client';

export const metadata = {
  title: 'Content Moderation & Reviews - MindOrbit Admin',
  description: 'Moderate patient reviews, review flagged feedback, or delete inappropriate content.',
};

export default async function AdminReviewsPage() {
  const adminDb = createAdminClient();

  let reviews: ReviewAdminDetail[] = [];
  try {
    // 1. Fetch reviews
    const { data: dbReviews, error: reviewsErr } = await adminDb
      .from('reviews')
      .select('id, rating, comment, is_flagged, created_at, patient_id, psychiatrist_id')
      .order('created_at', { ascending: false });

    // 2. Fetch users to map patient and doctor details
    const { data: dbUsers, error: usersErr } = await adminDb
      .from('users')
      .select('id, first_name, last_name, email, avatar_url');

    if (!reviewsErr && dbReviews && dbUsers) {
      const usersMap = new Map(dbUsers.map((u) => [u.id, u]));

      reviews = dbReviews.map((r: any) => {
        const patient: any = usersMap.get(r.patient_id) || {};
        const doctor: any = usersMap.get(r.psychiatrist_id) || {};

        return {
          id: r.id,
          rating: Number(r.rating),
          comment: r.comment || '',
          is_flagged: r.is_flagged,
          created_at: r.created_at,
          patientName: `${patient.first_name || 'Anonymous'} ${patient.last_name || ''}`.trim(),
          patientEmail: patient.email || 'unknown@user.com',
          patientAvatar: patient.avatar_url,
          doctorName: `${doctor.first_name || 'Clinician'} ${doctor.last_name || ''}`.trim(),
        };
      });
    } else if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
      reviews = [
        {
          id: 'rev1',
          rating: 5,
          comment: 'Dr. Jenkins was extremely understanding. The video consultation interface was crystal clear, and she really helped me structure my anxiety management routine.',
          is_flagged: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          patientName: 'Jane Doe',
          patientEmail: 'jane.doe@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          doctorName: 'Sarah Jenkins',
        },
        {
          id: 'rev2',
          rating: 1,
          comment: 'Completely fake psychiatrist! They did not turn on their video and kept speaking rudely. I want a refund of my money immediately.',
          is_flagged: true,
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          patientName: 'Jane Doe',
          patientEmail: 'jane.doe@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          doctorName: 'Amit Patel',
        },
        {
          id: 'rev3',
          rating: 4,
          comment: 'Very professional psychiatrist. Talked about my history, did a thorough assessment, and set up a proper therapy plan. Highly recommended.',
          is_flagged: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          patientName: 'Mark Robinson',
          patientEmail: 'mark.robinson@example.com',
          patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
          doctorName: 'Elena Rostova',
        }
      ];
    }
  } catch (err) {
    console.error('Error fetching admin reviews moderation list:', err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Review Moderation
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review clinic patient feedback, dismiss falsified flags, or delete spam and abusive comments.
        </p>
      </div>

      <ReviewsClient reviews={reviews} />
    </div>
  );
}
