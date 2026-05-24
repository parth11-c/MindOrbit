'use client';

import { useState } from 'react';
import { Check, HelpCircle, ChevronDown, Sparkles, AlertCircle, Shield, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const patientFaqs: FAQItem[] = [
    {
      question: "Are there any hidden subscription costs for patients?",
      answer: "No. Creating an account, browsing certified psychiatrists, and requesting appointments is entirely free. You only pay the consultation fee set by the doctor plus a small 3% safety and scheduling checkout fee."
    },
    {
      question: "What happens if a therapist rejects my booking request?",
      answer: "If a doctor declines or fails to respond to your request within 24 hours of the scheduled slot, the system automatically triggers a 100% refund. The money goes directly back to your original payment card."
    },
    {
      question: "How long does a refund take to process?",
      answer: "Since we use the Razorpay checkout simulator locally, refunds trigger instantly. In production, standard bank processing times apply, usually taking 3 to 5 business days."
    },
    {
      question: "Can I cancel a booking after it is approved?",
      answer: "Yes, you can request a cancellation from your Booking History page. If cancelled more than 24 hours before the session, a full refund is issued. Cancellations within 24 hours may be subject to a partial fee depending on the doctor's policy."
    }
  ];

  const doctorFaqs: FAQItem[] = [
    {
      question: "How and when do I receive my session payouts?",
      answer: "Once a booking request is accepted and the telehealth session is completed, the net amount is credited to your ledger dashboard. Payouts are batched and transferred to your registered bank account every Friday."
    },
    {
      question: "Is there an onboarding fee for psychiatrists?",
      answer: "No. Submitting your medical licenses, qualifications, and setting up your calendar slots is completely free on the Basic plan."
    },
    {
      question: "Can I change my session pricing at any time?",
      answer: "Absolutely. You can update your default consultation fee in your Doctor Profile dashboard whenever you want. Existing booked/pending appointments will maintain the price they were booked at."
    },
    {
      question: "How is the 15% platform commission calculated?",
      answer: "The platform cut is deducted from the gross session fee paid by the patient. For example, if you charge ₹2,000, the platform commission is ₹300, and your net payout is ₹1,700."
    }
  ];

  const faqs = activeTab === 'patient' ? patientFaqs : doctorFaqs;

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {/* Header and Toggle */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-neutral-100 dark:border-neutral-900 bg-gradient-to-b from-red-50/20 via-white to-transparent dark:from-red-950/10 dark:via-neutral-950 dark:to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900/50 uppercase tracking-wider">
            Simple & Transparent
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
            Fair Plans with <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-500 dark:to-red-300">No Hidden Costs</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-450 max-w-xl mx-auto">
            Whether you are seeking therapy or providing professional psychiatric care, we offer a transparent, escrowed financial framework.
          </p>

          {/* Toggle Tab */}
          <div className="inline-flex p-1 bg-[#F5EFE6] dark:bg-neutral-900 border border-[#EADFD1] dark:border-neutral-800 rounded-xl max-w-xs mx-auto">
            <button
              onClick={() => { setActiveTab('patient'); setOpenFaq(null); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'patient'
                  ? 'bg-[#EADFD1] dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-350'
              }`}
            >
              For Patients
            </button>
            <button
              onClick={() => { setActiveTab('doctor'); setOpenFaq(null); }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'doctor'
                  ? 'bg-[#EADFD1] dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-850 dark:hover:text-neutral-350'
              }`}
            >
              For Psychiatrists
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Container */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeTab === 'patient' ? (
            /* Patient Pricing View */
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-8 lg:p-10 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4 max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                    Pay Per Session
                  </div>
                  <h3 className="text-2xl font-black text-neutral-850 dark:text-white">Pay only for scheduled consultations</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Browse doctors freely, look up their qualifications, and compare pricing schedules. You are only charged when you submit a booking request.
                  </p>
                  <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Zero setup, monthly, or subscription fees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Safe payment lock in sandbox escrow</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>100% instant auto-refunds on declined requests</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/50 dark:border-neutral-800 p-6 rounded-2xl w-full md:w-64 space-y-4 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Clinical Consultation</span>
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">Direct Rate</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Price set directly by your chosen psychiatrist (e.g. ₹1,000 – ₹3,000/hour)
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <span className="text-[10px] font-semibold text-neutral-500 block">Plus platform safety fee</span>
                    <span className="font-bold text-xs text-neutral-850 dark:text-neutral-200">+3% payment cut</span>
                  </div>
                  <Link
                    href="/psychiatrists"
                    className="block w-full py-2.5 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Find a Doctor
                  </Link>
                </div>
              </div>

              {/* Guarantees Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-800 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-850 dark:text-white text-xs">Escrow Secured</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">Funds are held safely until the doctor accepts the booking request.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-red-800 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-850 dark:text-white text-xs">Instant Reversals</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">No phone calls needed. Declined bookings revert instantly.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-red-800 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-850 dark:text-white text-xs">Sandbox Testing</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">Check out using Razorpay demo keys. No real funds needed.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Doctor Pricing Tiers */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Listing Plan */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Standard Onboarding</h3>
                    <p className="text-[11px] text-neutral-450 mt-1">Perfect for psychiatrists starting their remote clinic.</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2 border-b dark:border-neutral-800">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">Free</span>
                    <span className="text-xs text-neutral-400">/ forever listing</span>
                  </div>

                  <ul className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Public Profile Board listing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Accept / Decline appointment flow</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>HD video rooms & calendar slots</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span className="font-bold text-neutral-850 dark:text-neutral-200">15% platform commission cut</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/sign-up"
                    className="block w-full text-center py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Onboard as Doctor
                  </Link>
                </div>
              </div>

              {/* Pro Member Plan */}
              <div className="bg-white dark:bg-neutral-900 border-2 border-red-700 rounded-3xl p-6 lg:p-8 shadow-md flex flex-col justify-between relative overflow-hidden">
                {/* Popular Pill */}
                <div className="absolute top-0 right-0 bg-red-600 text-neutral-900 dark:text-neutral-950 font-extrabold uppercase text-[8px] tracking-widest px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pro Clinician
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-lg">Pro Subscription</h3>
                    <p className="text-[11px] text-neutral-450 mt-1">For active therapists seeking maximum earnings split.</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2 border-b dark:border-neutral-800">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">₹2,999</span>
                    <span className="text-xs text-neutral-400">/ month</span>
                  </div>

                  <ul className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span className="font-semibold text-neutral-850 dark:text-white">Priority browsing listing order</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Verified Pro Profile Badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>HD video rooms & calendar slots</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span className="font-bold text-red-800 dark:text-red-400">Reduced 5% platform commission cut</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-red-800 flex-shrink-0" />
                      <span>Advanced analytics and weekly audits</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/sign-up"
                    className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Subscribe Pro Onboarding
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section className="py-16 border-t border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-900/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-450">
              Clear answers to standard operational and payment questions.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-50 dark:border-neutral-850">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Info Alert */}
      <section className="py-12 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/50 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-800 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-neutral-850 dark:text-neutral-250 text-xs">Emergency Crisis Notice</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                MindOrbit is a structured remote consultation platform. We do **not** provide emergency suicide/crisis services. If you are experiencing a severe psychiatric crisis, please contact your nearest local emergency medical line or suicide prevention helpline immediately.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
