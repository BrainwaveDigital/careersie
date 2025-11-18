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

  const handleGenerationComplete = (story: string) => {
    setGeneratedStory(story);
    setCurrentStep('preview');
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
    <div className="min-h-screen bg-gradient-to-br from-pink-950/40 via-purple-900/20 to-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with History Link */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-300 hover:bg-gray-500/30 transition-colors text-sm"
            >
              ← Main Menu
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              ✨ TalentStory Builder
            </h1>
          </div>
          <button
            onClick={() => router.push('/talent-story/history')}
            className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-colors text-sm"
          >
            📚 View History
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Step 1a: Profile */}
            <div className={`flex items-center ${currentStep === 'select-profile' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                selectedProfileId ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                currentStep === 'select-profile' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                {selectedProfileId ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden md:inline">Profile</span>
            </div>

            {/* Connector */}
            <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-pink-500/30 to-purple-600/30"></div>

            {/* Step 1b: Categories */}
            <div className={`flex items-center ${currentStep === 'select-categories' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                selectedCategories.length > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                currentStep === 'select-categories' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                {selectedCategories.length > 0 ? '✓' : '2'}
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden md:inline">Categories</span>
            </div>

            {/* Connector */}
            <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-pink-500/30 to-purple-600/30"></div>

            {/* Step 2: Customize */}
            <div className={`flex items-center ${currentStep === 'customize' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                generatedStory ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                currentStep === 'customize' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                {generatedStory ? '✓' : '3'}
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden md:inline">Customize</span>
            </div>

            {/* Connector */}
            <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-pink-500/30 to-purple-600/30"></div>

            {/* Step 3: Preview */}
            <div className={`flex items-center ${currentStep === 'preview' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                currentStep === 'preview' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' :
                'bg-pink-500/20 text-pink-400'
              }`}>
                4
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden md:inline">Preview</span>
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
              className="text-pink-400 hover:text-pink-300 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Category Selection
            </button>

            {/* Customization Panel */}
            <TalentStoryCustomizationPanel
              onGenerate={handleGenerationComplete}
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
              className="text-pink-400 hover:text-pink-300 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Customize
            </button>

            {/* Story Preview */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your TalentStory</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedStory)}
                    className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-colors text-sm"
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
                    className="px-4 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition-colors text-sm"
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
                className="flex-1 py-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
              >
                💾 Save to Profile
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex-1 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold"
              >
                🔗 Share TalentStory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save to Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              💾 Save to Profile
            </h3>
            
            <p className="text-gray-300 text-sm">
              This will save your TalentStory to your profile summary page. Add an optional note for context.
            </p>

            <textarea
              value={saveNote}
              onChange={(e) => setSaveNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full px-4 py-3 rounded-lg bg-black/40 border border-pink-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/60 resize-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={handleSaveToProfile}
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold disabled:opacity-50"
              >
                {isSaving ? '⏳ Saving...' : '✅ Save'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 py-3 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 font-semibold"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveNote('');
                }}
                className="px-6 py-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              🔗 Share TalentStory
            </h3>
            
            <p className="text-gray-300 text-sm">
              Share your TalentStory with others using this link:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Share URL"
                className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-purple-500/30 text-white text-sm font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('✅ Link copied to clipboard!');
                }}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold whitespace-nowrap"
              >
                📋 Copy Link
              </button>
            </div>

            <p className="text-gray-400 text-xs">
              Note: This link will allow anyone to view your TalentStory. Make sure you're comfortable sharing it publicly.
            </p>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
