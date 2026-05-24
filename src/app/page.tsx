import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Shield, CheckCircle, Calendar, MessageSquare, Award, ArrowRight, Star } from 'lucide-react';
import { handleJoinAsPsychiatrist } from '@/actions/sync-user';
import { formatCurrency } from '@/lib/utils';

interface FeaturedDoctor {
  id: string;
  name: string;
  avatar_url: string;
  specialization: string;
  experience: number;
  fee: number;
  rating: number;
  languages: string[];
}

export default async function LandingPage() {
  let featuredDocs: FeaturedDoctor[] = [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('psychiatrists')
      .select(`
        id,
        experience_years,
        consultation_fee,
        average_rating,
        languages_spoken,
        users (
          first_name,
          last_name,
          avatar_url
        ),
        specializations (
          name
        )
      `)
      .eq('verification_status', 'verified')
      .limit(3);

    if (!error && data && data.length > 0) {
      featuredDocs = data.map((doc: any) => ({
        id: doc.id,
        name: `Dr. ${doc.users?.first_name || ''} ${doc.users?.last_name || ''}`,
        avatar_url: doc.users?.avatar_url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250',
        specialization: doc.specializations?.name || 'Psychiatry',
        experience: doc.experience_years,
        fee: Number(doc.consultation_fee),
        rating: Number(doc.average_rating) || 5.0,
        languages: doc.languages_spoken || ['English'],
      }));
    }
  } catch (err) {
    console.error('Error fetching landing page doctors:', err);
  }

  return (
    <div className="w-full flex flex-col bg-background dark:bg-neutral-950 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 bg-red-100/50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/30 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
              <Shield className="w-3.5 h-3.5 text-red-700 fill-red-100 dark:fill-transparent" />
              <span>Verified Clinical Experts</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15] max-w-3xl mx-auto">
              Your path to <span className="text-red-800 italic underline decoration-red-200/50 decoration-wavy decoration-3 underline-offset-8">mental wellness</span> starts here.
            </h1>

            <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-medium">
              MindOrbit connects you with licensed, verified clinical psychiatrists for private, secure, and compassionate online consultations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/psychiatrists"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 font-semibold px-8 py-3.5 rounded-full transition-all shadow-md shadow-red-500/10 hover-lift"
              >
                <span>Browse Specialists</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <form action={handleJoinAsPsychiatrist} className="w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer"
                >
                  <span>Join as Practitioner</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Ambient Blur Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-40 dark:opacity-25">
          <div className="absolute -top-10 left-1/4 w-80 h-80 bg-red-200/40 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#F5E6DA]/50 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Minimal Statistics */}
      <section className="border-y border-neutral-200/40 bg-white/40 dark:bg-neutral-900/20 dark:border-neutral-900/60 py-10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">150+</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Clinicians</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">10K+</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Consultations</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">4.9/5</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">User Satisfaction</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">100%</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Encrypted & Secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Psychiatrists */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-800 uppercase tracking-widest">
                <Award className="w-3.5 h-3.5" />
                <span>Featured Specialists</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
                Top-rated practitioners online
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
                Secure consultations with verified doctors. Browse reviews, experience, and fee structures.
              </p>
            </div>
            <Link
              href="/psychiatrists"
              className="mt-4 md:mt-0 inline-flex items-center gap-1 text-xs font-bold text-red-800 hover:text-red-700 transition-colors uppercase tracking-wider"
            >
              <span>Explore all practitioners</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {featuredDocs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl overflow-hidden shadow-sm hover-lift"
                >
                  <div className="relative h-56 bg-neutral-100 dark:bg-neutral-850">
                    <img
                      src={doc.avatar_url}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xs px-2 py-0.5 rounded-lg flex items-center space-x-0.5 text-[10px] font-extrabold text-neutral-800 dark:text-white border border-neutral-100/50 dark:border-neutral-800">
                      <Star className="w-3 h-3 text-red-800 fill-red-800" />
                      <span>{doc.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-extrabold text-base text-neutral-900 dark:text-white leading-tight">
                          {doc.name}
                        </h3>
                        <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100 flex-shrink-0" />
                      </div>

                      <p className="text-[10px] text-red-800 font-bold uppercase tracking-wider">
                        {doc.specialization}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-50 dark:border-neutral-800">
                        <div>
                          <p className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-bold">Experience</p>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">{doc.experience} Years</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-bold">Languages</p>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5 truncate" title={doc.languages.join(', ')}>
                            {doc.languages.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-500 dark:text-neutral-400 uppercase font-bold">Consultation</p>
                        <p className="text-base font-extrabold text-neutral-950 dark:text-white">
                          {formatCurrency(doc.fee)}
                        </p>
                      </div>

                      <Link
                        href={`/psychiatrists/${doc.id}`}
                        className="bg-red-650 hover:bg-red-750 text-neutral-950 dark:text-neutral-950 text-xs font-semibold px-4.5 py-2 rounded-full transition-colors"
                      >
                        Book Session
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
              <p className="text-xs text-neutral-500 font-medium">No verified psychiatric practitioners listed yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white/40 dark:bg-neutral-900/20 border-t border-neutral-100 dark:border-neutral-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
              Consulting online is simple
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Our secure process is engineered for comfort, confidentiality, and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-red-100/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl flex items-center justify-center text-red-800 shadow-sm">
                <CheckCircle className="w-6 h-6 text-red-800" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">1. Select Practitioner</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
                Browse our directory of psychiatric specialists. Filter by specializations, experience levels, or language.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-red-100/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl flex items-center justify-center text-red-800 shadow-sm">
                <Calendar className="w-6 h-6 text-red-800" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">2. Reserve a Slot</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
                Choose a time that matches your schedule, verify details, and complete reservation via secure sandbox checkout.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 bg-red-100/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl flex items-center justify-center text-red-800 shadow-sm">
                <MessageSquare className="w-6 h-6 text-red-800" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">3. Connect Securely</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
                Enter your private session link directly from your dashboard and consult with your clinician online.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
