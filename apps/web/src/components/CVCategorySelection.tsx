/**
 * CV Category Selection Panel
 * 
 * Step 1: After selecting a profile, choose which categories/sections
 * from the CV to include in the TalentStory generation
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CategoryOption {
  key: string;
  label: string;
  description: string;
  icon: string;
  available: boolean;
  dataPreview?: string;
}

interface CVCategorySelectionProps {
  profileData: any;
  onContinue: (selectedCategories: string[]) => void;
  onBack: () => void;
}

export default function CVCategorySelection({ 
  profileData, 
  onContinue, 
  onBack 
}: CVCategorySelectionProps) {
  // Detect available categories from the parsed CV data
  const detectCategories = (): CategoryOption[] => {
    const data = profileData || {};
    
    return [
      {
        key: 'personalInfo',
        label: 'Personal Information',
        description: 'Name, contact details, location',
        icon: '👤',
        available: !!(data.full_name || data.fullName || data.email || data.phone || data.location),
        dataPreview: data.full_name || data.fullName || data.email || 'Contact information'
      },
      {
        key: 'summary',
        label: 'Professional Summary',
        description: 'Career overview and objectives',
        icon: '📝',
        available: !!(data.summary || data.headline || data.about),
        dataPreview: (data.summary || data.headline || data.about)?.substring(0, 100)
      },
      {
        key: 'experience',
        label: 'Work Experience',
        description: 'Employment history and roles',
        icon: '💼',
        available: !!(data.experience && data.experience.length > 0),
        dataPreview: data.experience?.[0]?.title || `${data.experience?.length || 0} positions`
      },
      {
        key: 'education',
        label: 'Education',
        description: 'Academic qualifications',
        icon: '🎓',
        available: !!(data.education && data.education.length > 0),
        dataPreview: data.education?.[0]?.degree || data.education?.[0]?.school || `${data.education?.length || 0} entries`
      },
      {
        key: 'skills',
        label: 'Skills & Competencies',
        description: 'Technical and soft skills',
        icon: '⚡',
        available: !!(data.skills && data.skills.length > 0) || !!(data.skillsData && data.skillsData.length > 0),
        dataPreview: data.skills?.slice(0, 3).join(', ') || `${data.skills?.length || data.skillsData?.length || 0} skills`
      },
      {
        key: 'certifications',
        label: 'Certifications',
        description: 'Professional certificates and licenses',
        icon: '🏆',
        available: !!(data.certifications && data.certifications.length > 0),
        dataPreview: data.certifications?.[0]?.name || `${data.certifications?.length || 0} certifications`
      },
      {
        key: 'projects',
        label: 'Projects',
        description: 'Notable projects and achievements',
        icon: '🚀',
        available: !!(data.projects && data.projects.length > 0),
        dataPreview: data.projects?.[0]?.name || `${data.projects?.length || 0} projects`
      },
      {
        key: 'languages',
        label: 'Languages',
        description: 'Language proficiencies',
        icon: '🌍',
        available: !!(data.languages && data.languages.length > 0),
        dataPreview: data.languages?.map((l: any) => l.name || l).join(', ') || `${data.languages?.length || 0} languages`
      },
      {
        key: 'awards',
        label: 'Awards & Honors',
        description: 'Recognition and achievements',
        icon: '🏅',
        available: !!(data.awards && data.awards.length > 0),
        dataPreview: data.awards?.[0]?.title || `${data.awards?.length || 0} awards`
      },
      {
        key: 'volunteer',
        label: 'Volunteer Work',
        description: 'Community service and involvement',
        icon: '🤝',
        available: !!(data.volunteer && data.volunteer.length > 0),
        dataPreview: data.volunteer?.[0]?.organization || `${data.volunteer?.length || 0} activities`
      },
      {
        key: 'publications',
        label: 'Publications',
        description: 'Research papers and articles',
        icon: '📚',
        available: !!(data.publications && data.publications.length > 0),
        dataPreview: data.publications?.[0]?.title || `${data.publications?.length || 0} publications`
      },
      {
        key: 'interests',
        label: 'Interests & Hobbies',
        description: 'Personal interests',
        icon: '🎨',
        available: !!(data.interests && data.interests.length > 0),
        dataPreview: data.interests?.slice(0, 3).join(', ') || `${data.interests?.length || 0} interests`
      }
    ];
  };

  const categories = detectCategories();
  const availableCategories = categories.filter(c => c.available);
  
  // Initialize with all available categories selected
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    availableCategories.map(c => c.key)
  );

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedCategories(availableCategories.map(c => c.key));
  };

  const deselectAll = () => {
    setSelectedCategories([]);
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category to continue');
      return;
    }
    onContinue(selectedCategories);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-pink-400 font-semibold mb-2">STEP 1 - PART 2</div>
        <h2 className="text-2xl font-bold text-white mb-2">Select CV Categories</h2>
        <p className="text-pink-300">
          Choose which sections from your CV to include in your TalentStory
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center glass-card p-4">
        <div className="text-white">
          <span className="font-semibold">{selectedCategories.length}</span>
          <span className="text-pink-300 ml-1">of {availableCategories.length} selected</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-colors text-sm"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.key);
          
          return (
            <button
              key={category.key}
              onClick={() => toggleCategory(category.key)}
              className={`glass-card p-5 text-left transition-all ${
                isSelected 
                  ? 'border-2 border-pink-500 bg-pink-500/10' 
                  : 'border border-pink-500/20 hover:border-pink-500/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {category.label}
                    </h3>
                    <p className="text-xs text-pink-400">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-500' 
                    : 'border-pink-500/30'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Data Preview */}
              {category.dataPreview && (
                <div className="mt-3 pt-3 border-t border-pink-500/20">
                  <p className="text-xs text-pink-300/80 line-clamp-2">
                    {category.dataPreview}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* No Categories Warning */}
      {availableCategories.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Categories Found</h3>
          <p className="text-pink-300">
            This CV appears to have no parseable content. Please select a different profile or upload a new CV.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 py-6 text-lg border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
        >
          ← Back to Profile Selection
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedCategories.length === 0}
          className="flex-1 py-6 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
        >
          Continue to Customization →
        </Button>
      </div>
    </div>
  );
}
