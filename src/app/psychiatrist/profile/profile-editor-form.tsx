'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { savePsychiatristProfile, uploadFileAction } from '@/actions/psychiatrist';
import { Save, AlertCircle, FileCheck, Check, Info, Camera, User, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Specialization {
  id: string;
  name: string;
}

interface ProfileFormProps {
  specializations: Specialization[];
  initialProfile: {
    specialization_id: string;
    experience_years: number;
    consultation_fee: number;
    gender: string;
    languages_spoken: string[];
    bio: string;
    education: string;
    verification_status: string;
  } | null;
  initialUser: {
    firstName: string;
    lastName: string;
    avatarUrl: string;
  } | null;
  documents: { id: string; document_name: string; document_url: string; uploaded_at: string }[];
}

const LANGUAGES_LIST = ['English', 'Hindi', 'Gujarati', 'Spanish', 'Russian', 'French', 'German', 'Kannada', 'Tamil', 'Bengali'];

export default function ProfileEditorForm({ specializations, initialProfile, initialUser, documents }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity Fields
  const [firstName, setFirstName] = useState(initialUser?.firstName || '');
  const [lastName, setLastName] = useState(initialUser?.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatarUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Qualifications Fields
  const [specializationId, setSpecializationId] = useState(initialProfile?.specialization_id || '');
  const [customSpecializationName, setCustomSpecializationName] = useState('');
  const [experience, setExperience] = useState(initialProfile?.experience_years || 0);
  const [fee, setFee] = useState(initialProfile?.consultation_fee || 500);
  const [gender, setGender] = useState(initialProfile?.gender || 'Male');
  const [languages, setLanguages] = useState<string[]>(initialProfile?.languages_spoken || ['English']);
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [education, setEducation] = useState(initialProfile?.education || '');
  
  // Document Upload fields
  const [docName, setDocName] = useState('Medical Board Certification License');
  const [docUrl, setDocUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [attachDoc, setAttachDoc] = useState(false);

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
      setError('Image size must be less than 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');

      const result = await uploadFileAction(formData);
      if (result.success && result.publicUrl) {
        setAvatarUrl(result.publicUrl);
      } else {
        setError(result.error || 'Failed to upload photo.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during image upload.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Document size must be less than 10MB.');
      return;
    }

    setIsUploadingDoc(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'documents');

      const result = await uploadFileAction(formData);
      if (result.success && result.publicUrl) {
        setDocUrl(result.publicUrl);
      } else {
        setError(result.error || 'Failed to upload document.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during document upload.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation checks
    if (!specializationId) {
      setError('Clinical Specialization is required. You cannot proceed or save without selecting a specialization.');
      setLoading(false);
      return;
    }

    if (specializationId === 'custom' && !customSpecializationName.trim()) {
      setError('Custom Specialization Name is required.');
      setLoading(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and Last name are required fields.');
      setLoading(false);
      return;
    }

    if (!avatarUrl || isDefaultAvatar(avatarUrl)) {
      setError('A custom profile image is mandatory. Please upload a profile photo.');
      setLoading(false);
      return;
    }

    if (experience < 0) {
      setError('Experience years must be a positive number.');
      setLoading(false);
      return;
    }

    if (fee < 100) {
      setError('Consultation fee must be at least ₹100.');
      setLoading(false);
      return;
    }

    if (languages.length === 0) {
      setError('Please select at least one language for patient consultations.');
      setLoading(false);
      return;
    }

    if (bio.trim().length < 30) {
      setError('Please write a professional biography (at least 30 characters).');
      setLoading(false);
      return;
    }

    if (education.trim().length < 15) {
      setError('Please provide your education and credentials (at least 15 characters).');
      setLoading(false);
      return;
    }

    if (attachDoc && (!docName.trim() || !docUrl.trim())) {
      setError('Please upload your certification license file.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        specialization_id: specializationId,
        experience_years: Number(experience),
        consultation_fee: Number(fee),
        gender,
        languages_spoken: languages,
        bio,
        education,
        document_name: attachDoc ? docName : undefined,
        document_url: attachDoc ? docUrl : undefined,
        firstName,
        lastName,
        avatarUrl,
        customSpecializationName: specializationId === 'custom' ? customSpecializationName : undefined
      };

      const result = await savePsychiatristProfile(payload);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Notifications banner */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold p-4 rounded-xl flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile configuration saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-400 text-xs font-semibold p-4 rounded-xl flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-800" />
          <span>{error}</span>
        </div>
      )}

      {/* Clinical Identity & Portrait */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-red-800" />
            <span>Clinical Identity & Portrait</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">Manage your public clinician details and profile photo.</p>
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <span>First Name</span>
              <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Jane"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <span>Last Name</span>
              <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Avatar Uploader & Choice */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <Camera className="w-4 h-4 text-red-800" />
              <span>Clinical Profile Photo</span>
            </label>
            <span className="text-[10px] text-red-800 dark:text-red-400 font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/20">
              Required
            </span>
          </div>

          {/* Warning if placeholder is detected */}
          {isDefaultAvatar(avatarUrl) && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 p-3.5 rounded-xl flex items-start space-x-2 text-xs leading-relaxed animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Default Avatar Detected:</strong> Clinicians are required to list a proper portrait photo. Please upload your professional photo below.
              </span>
            </div>
          )}

          {/* Image preview & upload action buttons */}
          <div className="flex items-center space-x-4 p-4 bg-neutral-50/50 dark:bg-neutral-950/30 border border-neutral-100 dark:border-neutral-850 rounded-2xl">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-700 bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
              {avatarUrl && !isDefaultAvatar(avatarUrl) ? (
                <img src={avatarUrl} alt="Clinical headshot preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600 text-xs font-bold bg-neutral-105 dark:bg-neutral-900">No Photo</div>
              )}
            </div>
            <div className="flex-grow space-y-1">
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Portrait Image Status</p>
              <p className={`text-[10px] font-medium ${isDefaultAvatar(avatarUrl) ? 'text-amber-600 dark:text-amber-450 font-bold' : 'text-emerald-605 dark:text-emerald-450 font-bold'}`}>
                {isDefaultAvatar(avatarUrl) ? '● No photo uploaded yet (Required)' : '✓ Profile photo uploaded and ready'}
              </p>
              {avatarUrl && !isDefaultAvatar(avatarUrl) && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-red-800 hover:text-red-750 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Replace Photo
                  </button>
                  {initialUser?.avatarUrl && !isDefaultAvatar(initialUser.avatarUrl) && avatarUrl !== initialUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(initialUser.avatarUrl)}
                      className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Use Account Photo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div className="relative group border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 hover:border-red-500/50 transition-all text-center flex flex-col items-center justify-center cursor-pointer bg-neutral-50/50 dark:bg-neutral-900/20 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/40">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mx-auto"></div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Uploading portrait to storage...</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 transition-colors mx-auto" />
                <div>
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-200">Drag & drop your profile photo, or <span className="text-red-800 dark:text-red-400 hover:underline">browse</span></p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Supports PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Professional Profile */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Clinical Qualifications</h2>
          <p className="text-xs text-neutral-400 mt-1">Specify your psychiatric specialty settings and experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specialization */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <span>Clinical Specialization</span>
              <span className="text-red-700">*</span>
            </label>
            <select
              required
              value={specializationId}
              onChange={(e) => {
                setSpecializationId(e.target.value);
                if (e.target.value !== 'custom') {
                  setCustomSpecializationName('');
                }
              }}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">Select Specialization</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
              <option value="custom">+ Add Custom Specialization...</option>
            </select>
          </div>

          {specializationId === 'custom' && (
            <div className="space-y-2 md:col-span-2 animate-fadeIn">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <span>Custom Specialization Name</span>
                <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                value={customSpecializationName}
                onChange={(e) => setCustomSpecializationName(e.target.value)}
                className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="e.g. Neuropsychiatry, Sleep Medicine"
              />
            </div>
          )}

          {/* Years of Experience */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Years of Experience</label>
            <input
              type="number"
              required
              min="0"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none"
            />
          </div>

          {/* Consultation Fee */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Consultation Fee (INR)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-neutral-400">₹</span>
              <input
                type="number"
                required
                min="100"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full pl-7 pr-3 border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* About & Bio */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Biography & Education Details</h2>
          <p className="text-xs text-neutral-400 mt-1">Provide a description of your clinical methodology and background.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">Consultant Biography</label>
            <textarea
              rows={4}
              required
              placeholder="Describe your methods, specialization details, burnout counseling practices..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">Education & Training</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. MD in Clinical Psychiatry from Harvard Medical School, Residency in Mental Health..."
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2.5 bg-white dark:bg-neutral-950 text-sm text-neutral-850 dark:text-neutral-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Languages Checklist */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Languages Spoken</h2>
          <p className="text-xs text-neutral-400 mt-1">Check the languages you can fluently consult in.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {LANGUAGES_LIST.map((lang) => {
            const isChecked = languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageToggle(lang)}
                className={`flex items-center space-x-2 text-xs p-2.5 rounded-lg border font-semibold text-left transition-colors ${
                  isChecked
                    ? 'border-red-200 bg-red-50 text-red-750 dark:bg-red-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-655 dark:text-neutral-400 hover:bg-neutral-55 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{lang}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verification Documents Upload section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Verification Documents & Licenses</h2>
          <p className="text-xs text-neutral-400 mt-1">Upload practitioner certifications for admin verification approval.</p>
        </div>

        {/* Existing documents */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Already Uploaded Files</label>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 p-3 rounded-lg text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{doc.document_name}</span>
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-800 hover:underline font-semibold"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Submit new board certification license?</span>
            <input
              type="checkbox"
              checked={attachDoc}
              onChange={(e) => setAttachDoc(e.target.checked)}
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
          </div>

          {attachDoc && (
            <div className="mt-4 space-y-4 pt-4 border-t border-neutral-205/50 dark:border-neutral-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Document Name</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-lg p-2 text-xs bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-200 focus:outline-none"
                  />
                </div>
                
                {/* Real File Input dropzone for Certificate */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Certification Document (PDF or Image)</label>
                  <div className="relative group border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-4 hover:border-red-500/50 transition-all text-center flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-neutral-950">
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocUpload}
                      disabled={isUploadingDoc}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                    />
                    {isUploadingDoc ? (
                      <div className="space-y-1 py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700 mx-auto"></div>
                        <p className="text-[10px] text-neutral-500 font-medium">Uploading license document...</p>
                      </div>
                    ) : (
                      <div className="space-y-1 py-1">
                        <FileText className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 transition-colors mx-auto" />
                        <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-250">Click or Drag & Drop certification file</p>
                        <p className="text-[9px] text-neutral-400">PDF, PNG, JPG (Max 10MB)</p>
                      </div>
                    )}
                  </div>

                  {docUrl && (
                    <div className="flex items-center space-x-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg mt-2 text-[11px] text-emerald-700 dark:text-emerald-450 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <div className="truncate flex-grow">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Uploaded successfully</p>
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-neutral-500 hover:text-red-600 underline truncate block">
                          View Uploaded Document
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-450 mt-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-lg">
                <Info className="w-3.5 h-3.5 text-red-800 flex-shrink-0" />
                <span>Submitting a new document triggers a verification check. Your profile status shifts back to &apos;pending&apos; during inspection.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || isUploadingPhoto || isUploadingDoc}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-neutral-900 dark:text-neutral-950 font-semibold px-8 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        <span>{loading ? 'Saving Profile...' : isUploadingPhoto ? 'Uploading Portrait...' : isUploadingDoc ? 'Uploading Document...' : 'Save Configuration'}</span>
      </button>
    </form>
  );
}
