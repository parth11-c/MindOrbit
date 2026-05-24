import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Star, GraduationCap, Award, Shield, ArrowLeft } from 'lucide-react';
import BookingCalendar from './booking-calendar';
import { formatCurrency, formatDate } from '@/lib/utils';



export default async function PsychiatristProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const patientId = user?.id || null;
  const isMockEnabled = process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true';

  let doctor: any = null;
  let slots: any[] = [];
  let reviews: any[] = [];

  try {
    const supabase = createAdminClient();

    // 1. Fetch Doctor
    const { data: docData, error: docError } = await supabase
      .from('psychiatrists')
      .select(`
        id,
        experience_years,
        consultation_fee,
        average_rating,
        gender,
        languages_spoken,
        bio,
        education,
        verification_status,
        users (
          first_name,
          last_name,
          avatar_url
        ),
        specializations (
          name
        )
      `)
      .eq('id', id)
      .single();

    if (docData && !docError) {
      const rawUser: any = Array.isArray(docData.users) ? docData.users[0] : docData.users;
      const rawSpec: any = Array.isArray(docData.specializations) ? docData.specializations[0] : docData.specializations;
      doctor = {
        id: docData.id,
        first_name: rawUser?.first_name || '',
        last_name: rawUser?.last_name || '',
        avatar_url: rawUser?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250',
        specialization_name: rawSpec?.name || 'Psychiatrist',
        experience_years: docData.experience_years,
        consultation_fee: Number(docData.consultation_fee),
        average_rating: Number(docData.average_rating) || 5.0,
        languages: docData.languages_spoken || ['English'],
        bio: docData.bio || '',
        education: docData.education || '',
        verification_status: docData.verification_status,
      };

      // 2. Fetch Availability Slots
      const { data: slotsData } = await supabase
        .from('availability_slots')
        .select('id, start_time, end_time, is_booked')
        .eq('psychiatrist_id', id)
        .eq('is_booked', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time');

      slots = slotsData || [];

      // 3. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          users (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('psychiatrist_id', id)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });

      reviews = reviewsData || [];
    } else {
      notFound();
    }
  } catch (err) {
    console.error('Error fetching doctor details:', err);
    notFound();
  }

  return (
    <div className="bg-background dark:bg-neutral-950 min-h-screen py-10 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Back Link */}
        <Link
          href="/psychiatrists"
          className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-neutral-450 hover:text-red-650 transition-colors mb-8 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to specialists</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Doctor Detailed Info (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Profile Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-850 flex-shrink-0 mx-auto md:mx-0 shadow-inner">
                <img
                  src={doctor.avatar_url}
                  alt={`Dr. ${doctor.first_name} ${doctor.last_name}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 text-center md:text-left flex-1">
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
                    <h1 className="text-xl md:text-2xl font-serif font-bold text-neutral-955 dark:text-white tracking-tight">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </h1>
                    {doctor.verification_status === 'verified' && (
                      <div className="inline-flex items-center justify-center space-x-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-lg text-[9px] font-bold text-emerald-700">
                        <Shield className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                        <span>Verified Specialist</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-red-800 uppercase tracking-widest">
                    {doctor.specialization_name}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-500 justify-center md:justify-start font-medium">
                  <div className="flex items-center space-x-0.5 text-red-800 font-bold">
                    <span>★</span>
                    <span>{doctor.average_rating.toFixed(2)}</span>
                  </div>
                  <span>•</span>
                  <span>{doctor.experience_years} Years Exp</span>
                  <span>•</span>
                  <span className="truncate max-w-[180px]">{doctor.languages.join(', ')}</span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed pt-2 font-medium">
                  {doctor.bio}
                </p>
              </div>
            </div>

            {/* Education & Qualifications */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-red-800" />
                <span>Education & Credentials</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed font-medium">
                {doctor.education || 'Board-certified medical qualifications verified by the clinical onboarding panel.'}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                <Star className="w-4 h-4 text-red-800" />
                <span>Patient reviews ({reviews.length})</span>
              </h2>

              {reviews.length === 0 ? (
                <p className="text-xs text-neutral-450 py-4 font-medium">No reviews recorded yet for this practitioner.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev: any) => {
                    const revUser: any = Array.isArray(rev.users) ? rev.users[0] : rev.users;
                    return (
                      <div key={rev.id} className="border-b border-neutral-50 dark:border-neutral-850 last:border-b-0 pb-4 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 text-red-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                              {revUser?.first_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                                {revUser?.first_name || 'Patient'} {revUser?.last_name || ''}
                              </p>
                              <p className="text-[9px] text-neutral-400 font-medium mt-0.5">{formatDate(rev.created_at)}</p>
                            </div>
                          </div>

                          <div className="flex text-amber-500 text-[10px]">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed pl-11 font-medium">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Appointment Scheduler (Right Column) */}
          <div className="lg:col-span-1">
            <BookingCalendar
              psychiatristId={doctor.id}
              slots={slots}
              fee={doctor.consultation_fee}
              isMockEnabled={isMockEnabled}
              patientId={patientId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
