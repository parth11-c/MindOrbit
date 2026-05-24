'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Star, CheckCircle, Search, SlidersHorizontal, Award, Globe, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  specialization_id: string;
  specialization_name: string;
  experience_years: number;
  consultation_fee: number;
  average_rating: number;
  gender: string;
  languages: string[];
  bio: string;
  verification_status: string;
}

interface Specialization {
  id: string;
  name: string;
}

interface ExplorerProps {
  initialDoctors: Doctor[];
  specializations: Specialization[];
  isSandbox?: boolean;
}

export default function DoctorExplorerClient({ initialDoctors, specializations, isSandbox }: ExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract all unique languages from doctors list
  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    initialDoctors.forEach((doc) => {
      doc.languages.forEach((lang) => langs.add(lang));
    });
    return Array.from(langs);
  }, [initialDoctors]);

  // Filtered Doctors list
  const filteredDoctors = useMemo(() => {
    return initialDoctors.filter((doc) => {
      const fullName = `${doc.first_name} ${doc.last_name}`.toLowerCase();
      const bioText = (doc.bio || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && !fullName.includes(searchLower) && !bioText.includes(searchLower)) {
        return false;
      }
      if (selectedSpecialization !== 'all' && doc.specialization_id !== selectedSpecialization) {
        return false;
      }
      if (selectedLanguage !== 'all' && !doc.languages.includes(selectedLanguage)) {
        return false;
      }
      if (selectedGender !== 'all' && doc.gender?.toLowerCase() !== selectedGender.toLowerCase()) {
        return false;
      }
      if (doc.consultation_fee > maxPrice) {
        return false;
      }
      if (doc.experience_years < minExperience) {
        return false;
      }
      if (doc.average_rating < minRating) {
        return false;
      }
      return true;
    });
  }, [initialDoctors, searchQuery, selectedSpecialization, selectedLanguage, selectedGender, maxPrice, minExperience, minRating]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpecialization('all');
    setSelectedLanguage('all');
    setSelectedGender('all');
    setMaxPrice(3000);
    setMinExperience(0);
    setMinRating(0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-neutral-200/40 pb-6 mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight">
            Find your clinician
          </h1>
          <p className="text-xs text-neutral-450 dark:text-neutral-500 font-medium">
            Book certified, verified online psychiatric care. Displaying {filteredDoctors.length} results.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4 text-neutral-450" />
          </div>
          <input
            type="text"
            placeholder="Search by doctor name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-full bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-red-500 outline-none text-neutral-900 dark:text-white shadow-sm transition-shadow"
          />
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 space-y-6 sticky top-24 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-50 dark:border-neutral-850 pb-4">
            <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-800" />
              <span>Filters</span>
            </h2>
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold text-red-800 hover:text-red-750 transition-colors uppercase tracking-wider"
            >
              Reset All
            </button>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Specialization</label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Language Spoken</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">All Languages</option>
              {allLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Experience Level</label>
            <select
              value={minExperience}
              onChange={(e) => setMinExperience(Number(e.target.value))}
              className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              <option value="0">Any Experience</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
              <option value="15">15+ Years</option>
            </select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-white focus:ring-1 focus:ring-red-500 focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Max Consultation Fee */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Max Session Fee</label>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-red-600 bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full cursor-pointer"
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Rating</label>
            <div className="flex flex-col gap-1.5">
              {[4.5, 4.0, 3.0, 0].map((ratingVal) => (
                <button
                  key={ratingVal}
                  type="button"
                  onClick={() => setMinRating(ratingVal)}
                  className={`flex items-center space-x-2 text-xs p-2 rounded-xl border text-left transition-all ${
                    minRating === ratingVal
                      ? 'border-red-200 bg-red-50/50 text-red-750 dark:bg-red-950/20 dark:border-red-900/35'
                      : 'border-transparent text-neutral-600 dark:text-neutral-450 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${minRating === ratingVal ? 'fill-red-650 text-red-600' : 'text-neutral-400'}`} />
                  <span className="font-semibold">{ratingVal === 0 ? 'Any Rating' : `${ratingVal} & Up`}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Search Results Grid */}
        <div className="flex-1 w-full">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-neutral-900 shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-800" />
              <span>Filters</span>
            </button>
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold text-neutral-450 hover:text-red-650 uppercase tracking-wider"
            >
              Clear
            </button>
          </div>

          {/* Doctors Pinterest Grid */}
          {filteredDoctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-16 text-center">
              <SlidersHorizontal className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-4" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">No Psychiatrists Found</h3>
              <p className="text-xs text-neutral-450 mt-1 max-w-xs leading-relaxed">
                Try expanding your search keywords or loosening the filter constraints.
              </p>
              <button
                onClick={clearFilters}
                className="mt-6 bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col md:flex-row bg-white dark:bg-neutral-900 border border-neutral-100/80 dark:border-neutral-800/80 rounded-2xl shadow-sm overflow-hidden hover-lift p-5 gap-5"
                >
                  {/* Doctor Picture */}
                  <div className="relative w-full md:w-36 h-40 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-850 flex-shrink-0 shadow-inner">
                    <img
                      src={doc.avatar_url}
                      alt={`Dr. ${doc.first_name} ${doc.last_name}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Rating Tag */}
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xs px-2 py-0.5 rounded-lg flex items-center space-x-0.5 text-[9px] font-extrabold text-neutral-800 dark:text-white border border-neutral-150/40">
                      {doc.average_rating > 0 ? (
                        <>
                          <span className="text-red-800">★</span>
                          <span>{doc.average_rating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-emerald-600">New</span>
                      )}
                    </div>
                    {/* Sandbox Pending State */}
                    {isSandbox && doc.verification_status === 'pending' && (
                      <div className="absolute bottom-3 left-3 bg-amber-500/90 backdrop-blur-xs text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Doctor Metadata */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/psychiatrists/${doc.id}`} className="font-extrabold text-sm text-neutral-900 dark:text-white hover:text-red-650 transition-colors leading-tight">
                          Dr. {doc.first_name} {doc.last_name}
                        </Link>
                        {doc.verification_status === 'verified' && (
                          <span title="Verified Clinical Specialist">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                        {doc.specialization_name}
                      </p>

                      <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed line-clamp-2 pt-1 font-medium">
                        {doc.bio || 'Consulting psychiatrist providing clinical therapy.'}
                      </p>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="inline-flex items-center gap-1 bg-neutral-50 dark:bg-neutral-850 px-2 py-0.5 rounded-lg text-[9px] text-neutral-500 font-bold border border-neutral-100 dark:border-neutral-800">
                          <Award className="w-3.5 h-3.5 text-red-800" />
                          <span>{doc.experience_years} Years</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-neutral-50 dark:bg-neutral-850 px-2 py-0.5 rounded-lg text-[9px] text-neutral-500 font-bold border border-neutral-100 dark:border-neutral-800">
                          <Globe className="w-3.5 h-3.5 text-red-800" />
                          <span className="truncate max-w-[80px]" title={doc.languages.join(', ')}>{doc.languages.slice(0, 2).join(', ')}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-50 dark:border-neutral-850 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-400 uppercase font-bold">Session Fee</p>
                        <p className="text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5">
                          {formatCurrency(doc.consultation_fee)}
                        </p>
                      </div>

                      <Link
                        href={`/psychiatrists/${doc.id}`}
                        className="bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
                      >
                        Book Session
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-80 h-full bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                  <SlidersHorizontal className="w-4 h-4 text-red-800" />
                  <span>Filter Options</span>
                </h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none"
                >
                  <option value="all">All Languages</option>
                  {allLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Max Price</label>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">{formatCurrency(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-red-600"
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Min Experience</label>
                <select
                  value={minExperience}
                  onChange={(e) => setMinExperience(Number(e.target.value))}
                  className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none"
                >
                  <option value="0">Any Experience</option>
                  <option value="5">5+ Years</option>
                  <option value="10">10+ Years</option>
                </select>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Gender</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full border border-neutral-200 dark:border-neutral-850 rounded-xl p-2.5 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white text-xs focus:outline-none"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-8 bg-red-600 hover:bg-red-750 text-neutral-900 dark:text-neutral-950 font-semibold w-full py-3 rounded-full shadow-sm text-xs transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
