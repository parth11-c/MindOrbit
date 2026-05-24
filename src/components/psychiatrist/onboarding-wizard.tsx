'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Sparkles, 
  Camera, 
  FileText, 
  BookOpen, 
  Award, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  HelpCircle,
  Clock,
  DollarSign,
  Globe
} from 'lucide-react';
import { completePsychiatristOnboarding, uploadFileAction } from '@/actions/psychiatrist';

interface Specialization {
  id: string;
  name: string;
}

interface OnboardingWizardProps {
  specializations: Specialization[];
  initialUser: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
    email: string;
  };
}

const LANGUAGES_LIST = ['English', 'Hindi', 'Gujarati', 'Spanish', 'Russian', 'French', 'German', 'Kannada', 'Tamil', 'Bengali'];

export default function PsychiatristOnboardingWizard({ specializations, initialUser }: OnboardingWizardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1 Fields (Identity & Photo)
  const [firstName, setFirstName] = useState(initialUser.firstName || '');
  const [lastName, setLastName] = useState(initialUser.lastName || '');
  const [gender, setGender] = useState('Female');
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatarUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // STEP 2 Fields (Qualifications)
  const [specializationId, setSpecializationId] = useState('');
  const [customSpecializationName, setCustomSpecializationName] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [consultationFee, setConsultationFee] = useState<number>(800);
  const [languages, setLanguages] = useState<string[]>(['English']);

  // STEP 3 Fields (Bio & Education)
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');

  // STEP 4 Fields (Verification Certification)
  const [docName, setDocName] = useState('State Medical Council Registration Certificate');
  const [docUrl, setDocUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [certifyCorrect, setCertifyCorrect] = useState(false);

  // Detect default/placeholder image
  const isDefaultAvatar = (url: string) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    return lower.includes('placeholder') || lower.includes('default_user') || (lower.includes('clerk') && (lower.includes('placeholder') || lower.includes('avatar') || lower.includes('user') || lower.includes('gravatar')));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      const result = await uploadFileAction(formData);
      if (result.success && result.publicUrl) {
        setAvatarUrl(result.publicUrl);
      } else {
        setErrorMsg(result.error || 'Failed to upload photo.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during image upload.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Document size must be less than 10MB.');
      return;
    }

    setIsUploadingDoc(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'documents');

      const result = await uploadFileAction(formData);
      if (result.success && result.publicUrl) {
        setDocUrl(result.publicUrl);
      } else {
        setErrorMsg(result.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during document upload.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const validateStep = (currentStep: number) => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Please enter your first name and last name.');
        return false;
      }
      if (!avatarUrl || isDefaultAvatar(avatarUrl)) {
        setErrorMsg('A custom profile image is mandatory. Please upload a profile photo.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!specializationId) {
        setErrorMsg('Please select a clinical specialization.');
        return false;
      }
      if (specializationId === 'custom' && !customSpecializationName.trim()) {
        setErrorMsg('Please enter your custom specialization name.');
        return false;
      }
      if (experienceYears < 0) {
        setErrorMsg('Experience years must be a positive number.');
        return false;
      }
      if (consultationFee < 100) {
        setErrorMsg('Consultation fee must be at least ₹100.');
        return false;
      }
      if (languages.length === 0) {
        setErrorMsg('Please select at least one language for patient consultations.');
        return false;
      }
    } else if (currentStep === 3) {
      if (bio.trim().length < 30) {
        setErrorMsg('Please write a professional biography (at least 30 characters).');
        return false;
      }
      if (education.trim().length < 15) {
        setErrorMsg('Please provide your education and credentials (at least 15 characters).');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    if (!certifyCorrect) {
      setErrorMsg('You must certify that all uploaded documents and profile information are valid.');
      return;
    }

    if (!docName.trim() || !docUrl.trim()) {
      setErrorMsg('Please upload your certification license file.');
      return;
    }

    setLoading(true);
    try {
      const result = await completePsychiatristOnboarding({
        firstName,
        lastName,
        avatarUrl,
        specializationId,
        experienceYears,
        consultationFee,
        gender,
        languagesSpoken: languages,
        bio,
        education,
        documentName: docName,
        documentUrl: docUrl,
        customSpecializationName: specializationId === 'custom' ? customSpecializationName : undefined
      });

      if (result.success) {
        // Success: reload the layout to clear onboarding blockade
        window.location.reload();
      } else {
        setErrorMsg(result.error || 'Failed to complete onboarding. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neutral-800/40 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Logo and Welcome */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2">
            <span className="bg-red-600 text-neutral-900 dark:text-neutral-950 px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wider">Mind</span>
            <span className="text-red-700 font-bold">Orbit</span>
            <span className="text-xs bg-neutral-800 border border-neutral-700 text-neutral-400 px-2 py-0.5 rounded-full font-semibold">Clinician Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Clinician Profile Walkthrough</h1>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Set up your clinical identity, credentials, and consulting settings to initiate listing verification review.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
            <span className={step >= 1 ? 'text-red-500' : ''}>1. Identity</span>
            <span className={step >= 2 ? 'text-red-500' : ''}>2. Practice</span>
            <span className={step >= 3 ? 'text-red-500' : ''}>3. Details</span>
            <span className={step >= 4 ? 'text-red-500' : ''}>4. Certification</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full mt-2 overflow-hidden flex">
            <div className={`h-full bg-red-600 transition-all duration-300 ${
              step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'
            }`} />
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="mb-6 bg-red-950/40 border border-red-900/50 text-red-400 p-4 rounded-xl flex items-start space-x-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <p className="font-bold">Walkthrough Check Failed</p>
              <p className="text-[11px] text-red-300/90 mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: IDENTITY & MANDATORY PHOTO */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <User className="w-4 h-4 text-red-700" />
                  <span>Step 1: Clinical Identity & Portrait</span>
                </h3>
              </div>

              {/* Name Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">Gender Identity</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Profile Avatar Selection Block */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-red-700" />
                    <span>Clinical Profile Portrait</span>
                  </label>
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/20">
                    Mandatory Field
                  </span>
                </div>

                {/* Warning if Clerk placeholder detected */}
                {isDefaultAvatar(avatarUrl) && (
                  <div className="bg-amber-950/20 border border-amber-900/40 text-amber-300 p-3 rounded-xl flex items-start space-x-2 text-[11px] leading-relaxed animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Default Photo Detected:</strong> Clinicians are required to list a proper portrait. Please upload your professional photo below.
                    </span>
                  </div>
                )}

                {/* Selected Image Preview */}
                <div className="flex items-center space-x-4 p-4 bg-neutral-900/30 border border-neutral-850 rounded-2xl">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-650 bg-neutral-800 flex-shrink-0">
                    {avatarUrl && !isDefaultAvatar(avatarUrl) ? (
                      <img src={avatarUrl} alt="Clinical headshot preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs font-bold bg-neutral-900">No Photo</div>
                    )}
                  </div>
                  <div className="flex-grow space-y-1">
                    <p className="text-xs font-bold text-neutral-200">Portrait Image Status</p>
                    <p className={`text-[10px] font-medium ${isDefaultAvatar(avatarUrl) ? 'text-amber-400 font-bold' : 'text-emerald-500 font-bold'}`}>
                      {isDefaultAvatar(avatarUrl) ? '● No photo uploaded yet (Required)' : '✓ Profile photo uploaded and ready'}
                    </p>
                    {avatarUrl && !isDefaultAvatar(avatarUrl) && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-red-700 hover:text-red-400 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          Replace Photo
                        </button>
                        {initialUser.avatarUrl && !isDefaultAvatar(initialUser.avatarUrl) && avatarUrl !== initialUser.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(initialUser.avatarUrl)}
                            className="text-[10px] font-bold text-neutral-400 hover:text-neutral-300 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Use Account Photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drag-and-drop Image Upload Box */}
                <div className="relative group border-2 border-dashed border-neutral-800 rounded-2xl p-6 hover:border-red-500/50 transition-all text-center flex flex-col items-center justify-center cursor-pointer bg-neutral-900/20 hover:bg-neutral-900/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                  />
                  {isUploadingPhoto ? (
                    <div className="space-y-2 py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                      <p className="text-xs text-neutral-400 font-medium">Uploading portrait to storage...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <Camera className="w-8 h-8 text-neutral-500 group-hover:text-red-500 transition-colors mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-neutral-200">Drag & drop your profile photo, or <span className="text-red-700 hover:underline">browse</span></p>
                        <p className="text-[10px] text-neutral-500 mt-1">Supports PNG, JPG, WEBP (Max 5MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROFESSIONAL PRACTICE & FEE */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-red-700" />
                  <span>Step 2: Qualifications & Consulting Setup</span>
                </h3>
              </div>

              {/* Specialization select */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Clinical Specialization <span className="text-red-700">*</span></label>
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/20">
                    Mandatory
                  </span>
                </div>
                <select
                  required
                  value={specializationId}
                  onChange={(e) => {
                    setSpecializationId(e.target.value);
                    if (e.target.value !== 'custom') {
                      setCustomSpecializationName('');
                    }
                  }}
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="">Choose Clinical Specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                  <option value="custom">+ Add Custom Specialization...</option>
                </select>
              </div>

              {specializationId === 'custom' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Custom Specialization Name <span className="text-red-700">*</span></label>
                  <input
                    type="text"
                    required
                    value={customSpecializationName}
                    onChange={(e) => setCustomSpecializationName(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="e.g. Neuropsychiatry, Sleep Medicine"
                  />
                </div>
              )}

              {/* Experience and Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Years of Experience</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="60"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Consultation Fee (INR)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Languages checklist */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Languages Spoken (Fluently)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES_LIST.map((lang) => {
                    const active = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                          active 
                            ? 'bg-red-950/40 text-red-400 border-red-900' 
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BIOGRAPHY & EDUCATION */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4 text-red-700" />
                  <span>Step 3: Background Biography & Education</span>
                </h3>
              </div>

              {/* Clinical Biography */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Consultant Biography</label>
                  <span className="text-[9px] text-neutral-500">Min 30 chars</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your methods, clinical background, burnout counseling practices, or areas of mental health expertise..."
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Education details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Education & Training credentials</label>
                  <span className="text-[9px] text-neutral-500">Min 15 chars</span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. MD in Psychiatry from King George's Medical University, Clinical Residency in Neuropsychology..."
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: BOARD LICENSE & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Award className="w-4 h-4 text-red-700" />
                  <span>Step 4: Practice License & Legal Verification</span>
                </h3>
              </div>

              <div className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl space-y-4">
                <p className="text-xs text-neutral-450 leading-relaxed">
                  As a certified medical provider, you must submit a valid practitioner registration license. MindOrbit administrators audit credentials before making your profile public.
                </p>

                {/* Doc Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Document / License Name</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Document File Uploader */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">Certification File (PDF or Image)</label>
                  
                  <div className="relative group border-2 border-dashed border-neutral-800 rounded-2xl p-6 hover:border-red-500/50 transition-all text-center flex flex-col items-center justify-center cursor-pointer bg-neutral-900/20 hover:bg-neutral-900/40">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocUpload}
                      disabled={isUploadingDoc}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                    />
                    {isUploadingDoc ? (
                      <div className="space-y-2 py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                        <p className="text-xs text-neutral-400 font-medium">Uploading license document...</p>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <FileText className="w-8 h-8 text-neutral-500 group-hover:text-red-500 transition-colors mx-auto" />
                        <div>
                          <p className="text-xs font-bold text-neutral-200">Drag & drop your certification file, or <span className="text-red-700 hover:underline">browse</span></p>
                          <p className="text-[10px] text-neutral-500 mt-1">Supports PDF, PNG, JPG (Max 10MB)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {docUrl && (
                    <div className="flex items-center space-x-3 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl mt-3 text-xs text-emerald-400 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="truncate flex-grow">
                        <p className="text-[11px] text-emerald-300">File uploaded successfully</p>
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-neutral-400 underline truncate block mt-0.5 hover:text-emerald-350 transition-colors">
                          View Uploaded Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Confirmation Checkbox */}
              <div className="p-4 bg-neutral-900/20 border border-neutral-800 rounded-2xl flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="certify_checkbox"
                  required
                  checked={certifyCorrect}
                  onChange={(e) => setCertifyCorrect(e.target.checked)}
                  className="accent-red-600 w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0"
                />
                <label htmlFor="certify_checkbox" className="text-[11px] text-neutral-400 leading-relaxed cursor-pointer select-none">
                  I hereby certify that I am a registered psychiatric clinician. I understand that all certifications, credentials, experience, and profile photos submitted will be audited. Profiles with fraudulent information will be permanently suspended.
                </label>
              </div>
            </div>
          )}

          {/* CONTROL NAVIGATION FOOTER BUTTONS */}
          <div className="flex justify-between items-center pt-6 border-t border-neutral-900">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-200 transition-colors bg-neutral-900 hover:bg-neutral-850 px-5 py-3 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isUploadingPhoto}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-950 bg-red-650 hover:bg-red-750 px-6 py-3 rounded-xl transition-all shadow-md shadow-red-950/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || isUploadingDoc}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-neutral-950 bg-red-600 hover:bg-red-750 px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-red-600/10 cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : isUploadingDoc ? (
                  <span>Uploading Document...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
