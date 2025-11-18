/**
 * TalentStory Generator Component
 * 
 * Add this to your dashboard to allow users to generate their TalentStory.
 * Usage: <TalentStoryGenerator />
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProfileStoryPrompt } from '@/lib/profileStoryPrompt';
import TalentStoryCustomizationPanel from './TalentStoryCustomizationPanel';

export default function TalentStoryGenerator() {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const handleGenerate = async (promptConfig?: Partial<ProfileStoryPrompt>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/talent-story/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fast and cost-effective
          promptConfig: promptConfig || {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate TalentStory');
      }

      setStory(data.story.story);
      setShowCustomization(false); // Hide customization after generation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    // Show customization panel for regeneration
    setStory(null);
    setShowCustomization(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your TalentStory</h2>
          <p className="text-pink-300 mt-1">
            Transform your profile into a beautiful narrative
          </p>
        </div>
        
        {story && !loading && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCustomization(!showCustomization)}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              ⚙️ Customize
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              🔄 Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Customization Panel (shown when no story or when customizing) */}
      {((!story && !loading) || showCustomization) && (
        <TalentStoryCustomizationPanel
          onGenerate={handleGenerate}
          loading={loading}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
            <h3 className="text-xl font-semibold text-white">
              Crafting Your Story...
            </h3>
            <p className="text-pink-300">
              AI is analyzing your experience and writing your narrative
            </p>
            <div className="space-y-2 text-sm text-pink-400/80">
              <p>📝 Reviewing your experience...</p>
              <p>🎨 Identifying your strengths...</p>
              <p>✨ Writing your unique story...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-card p-6 border border-red-500/30 bg-red-500/5">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-red-400 font-semibold">Error</h4>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={() => handleGenerate()}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Story Display */}
      {story && !loading && (
        <div className="glass-card p-8">
          <div className="prose prose-invert prose-pink max-w-none">
            {/* Simple markdown rendering - you can use react-markdown for better formatting */}
            <div
              className="space-y-6 text-pink-100"
              dangerouslySetInnerHTML={{
                __html: story
                  .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-pink-200 mt-6 mb-3">$1</h3>')
                  .replace(/^\- (.+)$/gm, '<li class="ml-4">$1</li>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                  .replace(/\n\n/g, '</p><p class="mb-4">')
                  .replace(/^(.+)$/gm, '<p class="mb-4">$1</p>'),
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-pink-500/20">
            <Button
              onClick={() => {
                // Copy to clipboard
                navigator.clipboard.writeText(story);
              }}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              📋 Copy
            </Button>
            <Button
              onClick={() => {
                // Download as markdown
                const blob = new Blob([story], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'talent-story.md';
                a.click();
              }}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              💾 Download
            </Button>
            <Button
              onClick={() => {
                // Share functionality (implement based on your needs)
                alert('Share functionality coming soon!');
              }}
              variant="outline"
              className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
            >
              🔗 Share
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
