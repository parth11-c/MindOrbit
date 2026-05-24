import Link from 'next/link';
import { ShieldCheck, Video, Calendar, UserCheck, Heart, Award, Users, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'About Our Mission & Values - MindOrbit',
  description: 'Learn about MindOrbit, our team, our clinical standards, and how we are revolutionizing mental health care accessibility.',
};

export default function AboutPage() {
  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-neutral-100 dark:border-neutral-900 bg-gradient-to-b from-red-50/30 via-white to-transparent dark:from-red-950/10 dark:via-neutral-950 dark:to-transparent">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)]" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900/50 uppercase tracking-wider">
            Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Redefining Mental Health Care through <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-500 dark:to-red-300">Technology & Trust</span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-550 dark:text-neutral-450 max-w-2xl mx-auto leading-relaxed">
            MindOrbit is built to bridge the gap between patients seeking help and certified psychiatrists providing premium clinical evaluations. We put trust, privacy, and clinical quality at the forefront.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/psychiatrists"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-650 dark:hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-red-550/10 hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              Browse Doctors <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border border-neutral-200 hover:border-neutral-350 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 text-neutral-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Board */}
      <section className="py-12 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">99.8%</p>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Patient Satisfaction</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">15K+</p>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Completed Consultations</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">200+</p>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Verified Psychiatrists</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">&lt; 15m</p>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Average Wait Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Mechanism: How it works */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              A Secure, Approval-Based Consultation Flow
            </h2>
            <p className="text-xs sm:text-sm text-neutral-450 max-w-xl mx-auto">
              Our clinical protocol puts doctors in control to ensure every consultation is appropriate for telehealth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4 hover:border-neutral-250 dark:hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-white text-base">Select & Book</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Discover psychiatrists by sub-specialty, language, and gender. Securely reserve a time slot via Razorpay sandbox.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4 hover:border-neutral-250 dark:hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-white text-base">Clinical Verification</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                The psychiatrist reviews your request, medical intent, and details. They must explicitly accept the request.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4 hover:border-neutral-250 dark:hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-white text-base">Safe Refunds</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                If a therapist declines or misses the appointment, our backend instantly cancels and processes a 100% gateway refund.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-4 hover:border-neutral-250 dark:hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-bold text-neutral-850 dark:text-white text-base">Telehealth Session</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Upon therapist approval, join the integrated HD audio/video room directly from your dashboard with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-20 lg:py-24 border-t border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Our Foundational Pillars
            </h2>
            <p className="text-xs sm:text-sm text-neutral-450 max-w-xl mx-auto">
              Our platform operates under strict medical coordination guidelines and data security parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 flex-shrink-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-neutral-850 dark:text-white text-sm">HIPAA & GDPR Standards</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Every interaction is fully encrypted. We enforce zero logs on clinical conversations and adhere to maximum privacy benchmarks.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 flex-shrink-0 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-neutral-850 dark:text-white text-sm">Rigorous Doctor Vetting</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Every psychiatrist undergoes manual medical degree and certification credentialing reviews by MindOrbit administrators before accepting bookings.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 flex-shrink-0 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-neutral-850 dark:text-white text-sm">No Double-Crediting Safe Ledger</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Funds are secured and escrowed. Therapists are credited only upon explicit clinical session approval and verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take Control of Your Journey?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto">
            Book an appointment with one of our hand-picked, verified psychiatric specialists. Start with a risk-free booking request.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/psychiatrists"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Find a Psychiatrist
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border border-neutral-700 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
