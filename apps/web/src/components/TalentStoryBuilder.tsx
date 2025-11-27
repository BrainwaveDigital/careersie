/**
 * TalentStory Builder - Complete 7-Step UI Flow
 * 
 * Orchestrates the full applicant experience:
 * Step 1: Upload CV & Media
 * Step 2-3: Choose Tone & Story Type (TalentStoryCustomizationPanel)
 * Step 4-6: Focus Skills, Sections, Custom Prompt (TalentStoryCustomizationPanel)
 * Step 7: Generate TalentStory
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileSelectionPanel from './ProfileSelectionPanel';
import CVCategorySelection from './CVCategorySelection';
import TalentStoryCustomizationPanel from './TalentStoryCustomizationPanel';
import { ProfileStoryPrompt } from '@/lib/profileStoryPrompt';
import ReactMarkdown from 'react-markdown';

type FlowStep = 'select-profile' | 'select-categories' | 'customize' | 'preview';

export default function TalentStoryBuilder() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>('select-profile');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [saveNote, setSaveNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSelect = (profileId: string, data: any) => {
    setSelectedProfileId(profileId);
    setProfileData(data);
    setCurrentStep('select-categories');
  };

  const handleCategoriesSelected = (categories: string[]) => {
    setSelectedCategories(categories);
    setCurrentStep('customize');
  };


  // New: async handler for TalentStoryCustomizationPanel
  const handleGenerate = async (promptConfig?: Partial<ProfileStoryPrompt>) => {
    try {
      const response = await fetch('/api/talent-story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profileId: selectedProfileId,
          promptConfig: promptConfig || {},
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate story');
      }
      const data = await response.json();
      setGeneratedStory(data.story);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate TalentStory. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStep === 'select-categories') {
      setCurrentStep('select-profile');
    } else if (currentStep === 'customize') {
      setCurrentStep('select-categories');
    } else if (currentStep === 'preview') {
      setCurrentStep('customize');
    }
  };

  const handleRegenerate = () => {
    setCurrentStep('customize');
    setGeneratedStory(null);
  };

  const handleBackToMenu = () => {
    const hasProgress = selectedProfileId || generatedStory;
    if (hasProgress) {
      if (confirm('⚠️ Are you sure you want to leave? Any unsaved progress will be lost.')) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const handleSaveToProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profiles/update-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profileId: selectedProfileId,
          summary: generatedStory,
          note: saveNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      setShowSaveModal(false);
      setSaveNote('');
      
      // Redirect to history page
      if (confirm('✅ TalentStory saved! Would you like to view your history?')) {
        router.push('/talent-story/history');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save. The story has been copied to clipboard as backup.');
      await navigator.clipboard.writeText(generatedStory || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Simple HTML-to-PDF approach using browser print
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Popup blocked');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>TalentStory</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              h1, h2, h3 { color: #333; }
              p { margin-bottom: 1em; }
            </style>
          </head>
          <body>
            ${generatedStory?.replace(/\n/g, '<br>').replace(/##\s/g, '<h2>').replace(/<br><h2>/g, '<h2>').replace(/<\/h2><br>/g, '</h2>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // After download, offer to view history
        setTimeout(() => {
          if (confirm('📄 PDF ready! Would you like to view your TalentStory history?')) {
            router.push('/talent-story/history');
          }
        }, 1000);
      }, 500);
    } catch (error) {
      console.error('PDF error:', error);
      alert('❌ Failed to generate PDF. Please use the Download button to save as markdown.');
    }
  };

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/talent-story/view/${selectedProfileId}`;

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)'
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header with History Link */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="px-4 py-2 rounded-lg text-sm transition-all hover:transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9AA4B2'
              }}
            >
              ← Main Menu
            </button>
            <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
              ✨ TalentStory Builder
            </h1>
          </div>
          <button
            onClick={() => router.push('/talent-story/history')}
            className="px-4 py-2 rounded-lg text-sm transition-all hover:transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
              color: '#FFFFFF',
              boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
              border: 'none'
            }}
          >
            📚 View History
          </button>
        </div>

        {/* Progress Indicator */}
        <div
          className="p-4 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Step 1a: Profile */}
            <div className={`flex items-center ${currentStep === 'select-profile' ? 'opacity-100' : 'opacity-50'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: selectedProfileId
                    ? 'rgba(74, 222, 128, 0.2)'
                    : currentStep === 'select-profile'
                    ? 'linear-gradient(135deg, #4ff1e3, #536dfe)'
                    : 'rgba(79, 241, 227, 0.15)',
                  color: selectedProfileId || currentStep === 'select-profile' ? '#FFFFFF' : '#4ff1e3',
                  border: selectedProfileId
                    ? '1px solid rgba(74, 222, 128, 0.3)'
                    : '1px solid rgba(79, 241, 227, 0.3)'
                }}
              >
                {selectedProfileId ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline" style={{ color: '#FFFFFF' }}>Profile</span>
            </div>

            {/* Connector */}
            <div
              className="flex-1 h-0.5 mx-2"
              style={{ background: 'rgba(79, 241, 227, 0.2)' }}
            ></div>

            {/* Step 1b: Categories */}
            <div className={`flex items-center ${currentStep === 'select-categories' ? 'opacity-100' : 'opacity-50'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: selectedCategories.length > 0
                    ? 'rgba(74, 222, 128, 0.2)'
                    : currentStep === 'select-categories'
                    ? 'linear-gradient(135deg, #4ff1e3, #536dfe)'
                    : 'rgba(79, 241, 227, 0.15)',
                  color: selectedCategories.length > 0 || currentStep === 'select-categories' ? '#FFFFFF' : '#4ff1e3',
                  border: selectedCategories.length > 0
                    ? '1px solid rgba(74, 222, 128, 0.3)'
                    : '1px solid rgba(79, 241, 227, 0.3)'
                }}
              >
                {selectedCategories.length > 0 ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline" style={{ color: '#FFFFFF' }}>Categories</span>
            </div>

            {/* Connector */}
            <div
              className="flex-1 h-0.5 mx-2"
              style={{ background: 'rgba(79, 241, 227, 0.2)' }}
            ></div>

            {/* Step 2: Customize */}
            <div className={`flex items-center ${currentStep === 'customize' ? 'opacity-100' : 'opacity-50'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: generatedStory
                    ? 'rgba(74, 222, 128, 0.2)'
                    : currentStep === 'customize'
                    ? 'linear-gradient(135deg, #4ff1e3, #536dfe)'
                    : 'rgba(79, 241, 227, 0.15)',
                  color: generatedStory || currentStep === 'customize' ? '#FFFFFF' : '#4ff1e3',
                  border: generatedStory
                    ? '1px solid rgba(74, 222, 128, 0.3)'
                    : '1px solid rgba(79, 241, 227, 0.3)'
                }}
              >
                {generatedStory ? '✓' : '3'}
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline" style={{ color: '#FFFFFF' }}>Customize</span>
            </div>

            {/* Connector */}
            <div
              className="flex-1 h-0.5 mx-2"
              style={{ background: 'rgba(79, 241, 227, 0.2)' }}
            ></div>

            {/* Step 3: Preview */}
            <div className={`flex items-center ${currentStep === 'preview' ? 'opacity-100' : 'opacity-50'}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: currentStep === 'preview'
                    ? 'linear-gradient(135deg, #4ff1e3, #536dfe)'
                    : 'rgba(79, 241, 227, 0.15)',
                  color: currentStep === 'preview' ? '#FFFFFF' : '#4ff1e3',
                  border: '1px solid rgba(79, 241, 227, 0.3)'
                }}
              >
                4
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline" style={{ color: '#FFFFFF' }}>Preview</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'select-profile' && (
          <ProfileSelectionPanel onSelect={handleProfileSelect} />
        )}

        {currentStep === 'select-categories' && profileData && (
          <CVCategorySelection
            profileData={profileData}
            onContinue={handleCategoriesSelected}
            onBack={handleBack}
          />
        )}

        {currentStep === 'customize' && (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center text-sm transition-colors"
              style={{ color: '#4ff1e3' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#3dd6c9'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4ff1e3'}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Category Selection
            </button>

            {/* Customization Panel */}
            <TalentStoryCustomizationPanel
              onGenerate={handleGenerate}
              cvData={profileData}
              profileId={selectedProfileId}
            />
          </div>
        )}

        {currentStep === 'preview' && generatedStory && (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center text-sm transition-colors"
              style={{ color: '#4ff1e3' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#3dd6c9'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4ff1e3'}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Customize
            </button>

            {/* Story Preview */}
            <div
              className="p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(25px)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
                borderRadius: '20px'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Your TalentStory</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    className="px-4 py-2 rounded-lg text-sm transition-all hover:transform hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#9AA4B2'
                    }}
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedStory)}
                    className="px-4 py-2 rounded-lg text-sm transition-all hover:transform hover:scale-105"
                    style={{
                      background: 'rgba(79, 241, 227, 0.15)',
                      border: '1px solid rgba(79, 241, 227, 0.3)',
                      color: '#4ff1e3'
                    }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedStory], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'talent-story.md';
                      a.click();
                    }}
                    className="px-4 py-2 rounded-lg text-sm transition-all hover:transform hover:scale-105"
                    style={{
                      background: 'rgba(79, 241, 227, 0.15)',
                      border: '1px solid rgba(79, 241, 227, 0.3)',
                      color: '#4ff1e3'
                    }}
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="prose prose-invert prose-pink max-w-none">
                <ReactMarkdown>{generatedStory}</ReactMarkdown>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex-1 py-4 rounded-lg font-semibold transition-all hover:transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                  border: 'none'
                }}
              >
                💾 Save to Profile
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-1 py-4 rounded-lg font-semibold transition-all hover:transform hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF'
                }}
              >
                🔗 Share TalentStory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save to Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div
            className="max-w-lg w-full p-6 space-y-4"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <h3 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              💾 Save to Profile
            </h3>
            
            <p className="text-sm" style={{ color: '#9AA4B2' }}>
              This will save your TalentStory to your profile summary page. Add an optional note for context.
            </p>

            <textarea
              value={saveNote}
              onChange={(e) => setSaveNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full px-4 py-3 rounded-lg resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                outline: 'none'
              }}
              rows={3}
              onFocus={(e) => e.target.style.border = '1px solid rgba(79, 241, 227, 0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
            />

            <div className="flex gap-3">
              <button
                onClick={handleSaveToProfile}
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg font-semibold transition-all hover:transform hover:scale-105 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                  border: 'none'
                }}
              >
                {isSaving ? '⏳ Saving...' : '✅ Save'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 py-3 rounded-lg font-semibold transition-all hover:transform hover:scale-105"
                style={{
                  background: 'rgba(79, 241, 227, 0.15)',
                  border: '1px solid rgba(79, 241, 227, 0.3)',
                  color: '#4ff1e3'
                }}
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveNote('');
                }}
                className="px-6 py-3 rounded-lg transition-all hover:transform hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}>
          <div
            className="max-w-lg w-full p-6 space-y-4"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <h3 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              🔗 Share TalentStory
            </h3>
            
            <p className="text-sm" style={{ color: '#9AA4B2' }}>
              Share your TalentStory with others using this link:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Share URL"
                className="flex-1 px-4 py-3 rounded-lg text-sm font-mono"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF'
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('✅ Link copied to clipboard!');
                }}
                className="px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all hover:transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                  border: 'none'
                }}
              >
                📋 Copy Link
              </button>
            </div>

            <p className="text-xs" style={{ color: '#9AA4B2' }}>
              Note: This link will allow anyone to view your TalentStory. Make sure you're comfortable sharing it publicly.
            </p>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 rounded-lg transition-all hover:transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9AA4B2'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
