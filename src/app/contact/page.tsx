'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ShieldAlert, CheckCircle2, User, HelpCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'patient',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Simulate sending email/message to backing admin
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setErrorMsg('Failed to dispatch contact request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {/* Hero Header */}
      <section className="relative overflow-hidden py-16 lg:py-20 border-b border-neutral-100 dark:border-neutral-900 bg-gradient-to-b from-red-50/20 via-white to-transparent dark:from-red-950/10 dark:via-neutral-950 dark:to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900/50 uppercase tracking-wider">
            Support center
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
            How Can We <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent dark:from-red-500 dark:to-red-300">Help You?</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-450 max-w-xl mx-auto">
            Have questions about booking validations, therapist license reviews, or platform technical support? Fill in the request below.
          </p>
        </div>
      </section>

      {/* Main Grid: Form & Info */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Info Columns */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-neutral-850 dark:text-white text-base">Contact Details</h3>
                  <p className="text-[10px] text-neutral-400 mt-1">Get in touch directly via mail or telephone lines.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-450 uppercase text-[9px]">General Support</p>
                      <a href="mailto:support@mindorbit.com" className="font-semibold text-neutral-850 dark:text-neutral-200 hover:text-red-600">
                        support@mindorbit.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-450 uppercase text-[9px]">Phone Support</p>
                      <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                        +1 (800) 555-0199
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-450 uppercase text-[9px]">Clinical Head Office</p>
                      <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                        100 Medical Plaza, Suite 400, SF, CA
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-450 uppercase text-[9px]">Operational Hours</p>
                      <p className="font-semibold text-neutral-850 dark:text-neutral-200">
                        Monday – Friday, 9:00 AM – 6:00 PM EST
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Help box */}
              <div className="bg-red-600 text-neutral-900 dark:text-neutral-950 p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                <HelpCircle className="w-8 h-8 text-red-200 relative" />
                <div className="space-y-1 relative">
                  <h4 className="font-bold text-sm">Need Booking Help?</h4>
                  <p className="text-[11px] text-red-100 leading-relaxed">
                    Check out our transparent refund policies on the Pricing Page or monitor your upcoming schedule approvals inside your account dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 lg:p-8 rounded-2xl shadow-sm">
                {success ? (
                  /* Form Success Animated State */
                  <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Message Dispatched Successfully</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Thank you for contacting MindOrbit. Our clinical operations team will review your inquiry and reply via email within 12–24 business hours.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setFormData({ name: '', email: '', role: 'patient', subject: '', message: '' });
                      }}
                      className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  /* Form Content */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="font-extrabold text-neutral-850 dark:text-white text-base">Send a Message</h3>
                      <p className="text-[10px] text-neutral-400 mt-1">We enforce standard response guarantees on all user submissions.</p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-750 text-xs rounded-xl flex items-center gap-2 font-semibold">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label htmlFor="name" className="text-[10px] font-bold text-neutral-400 uppercase">Your Name</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Jane Doe"
                          className="w-full px-3 py-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-[10px] font-bold text-neutral-400 uppercase">Email Address</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="jane.doe@example.com"
                          className="w-full px-3 py-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role selection */}
                      <div className="space-y-1">
                        <label htmlFor="role" className="text-[10px] font-bold text-neutral-400 uppercase">I am a...</label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650 cursor-pointer"
                        >
                          <option value="patient">Patient seeking therapy</option>
                          <option value="doctor">Psychiatrist seeking onboarding</option>
                          <option value="other">General inquirer / Guest</option>
                        </select>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1">
                        <label htmlFor="subject" className="text-[10px] font-bold text-neutral-400 uppercase">Subject Topic</label>
                        <input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Booking cancellation, verification update, etc."
                          className="w-full px-3 py-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <label htmlFor="message" className="text-[10px] font-bold text-neutral-400 uppercase">Detailed Message</label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Write down the details of your inquiry..."
                        className="w-full px-3 py-2.5 text-xs border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-850 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-650"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Secure Inquiry</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
