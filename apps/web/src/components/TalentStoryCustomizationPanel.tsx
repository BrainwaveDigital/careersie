/**
 * TalentStory Customization Panel
 * 
 * Advanced options for customizing TalentStory generation.
 * Allows users to control tone, sections, focus, and more.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProfileStoryPrompt, TONE_DESCRIPTIONS, STORY_TYPE_DESCRIPTIONS } from '@/lib/profileStoryPrompt';

interface CustomizationPanelProps {
  onGenerate: (story: string) => void; // Receives the generated story text
  cvData?: any; // Optional CV data from Step 1
  profileId?: string | null; // Profile ID for API request
  loading?: boolean;
}

export default function TalentStoryCustomizationPanel({
  onGenerate,
  profileId,
  loading = false,
}: CustomizationPanelProps) {
  const [config, setConfig] = useState<Partial<ProfileStoryPrompt>>({
    tone: 'professional',
    storyType: 'full',
    length: 'medium',
    includeSections: {
      summary: true,
      skillThemes: true,
      timeline: true,
      strengths: true,
      highlights: true,
      careerPaths: true,
      mediaShowcase: false,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focusSkillsInput, setFocusSkillsInput] = useState('');
  const [customPromptInput, setCustomPromptInput] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const finalConfig: Partial<ProfileStoryPrompt> = {
        ...config,
        focusSkills: focusSkillsInput
          ? focusSkillsInput.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        customPrompt: customPromptInput || undefined,
        targetRole: targetRoleInput || undefined,
      };

      // Call API to generate story
      const response = await fetch('/api/talent-story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ 
          profileId,
          promptConfig: finalConfig 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to generate story');
      }

      const data = await response.json();
      onGenerate(data.story); // Pass the story text back
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate TalentStory. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tone Selection */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tone</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(TONE_DESCRIPTIONS).map(([tone, description]) => (
            <button
              key={tone}
              onClick={() => setConfig({ ...config, tone: tone as ProfileStoryPrompt['tone'] })}
              className={`p-4 rounded-lg border-2 transition-all ${
                config.tone === tone
                  ? 'border-pink-500 bg-pink-500/20'
                  : 'border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40'
              }`}
            >
              <div className="text-white font-medium capitalize">{tone}</div>
              <div className="text-xs text-pink-300 mt-1">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Story Type */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Story Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(STORY_TYPE_DESCRIPTIONS).map(([type, description]) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, storyType: type as ProfileStoryPrompt['storyType'] })}
              className={`p-4 rounded-lg border-2 transition-all ${
                config.storyType === type
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40'
              }`}
            >
              <div className="text-white font-medium capitalize">{type}</div>
              <div className="text-xs text-purple-300 mt-1">{description}</div>
            </button>
          ))}
        </div>

        {config.storyType === 'role-specific' && (
          <div className="mt-4">
            <label className="text-sm text-pink-300 mb-2 block">Target Role</label>
            <input
              type="text"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              className="w-full p-3 rounded-lg bg-black/30 border border-pink-500/30 text-white placeholder-pink-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>
        )}
      </div>

      {/* Length */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Length</h3>
        <div className="flex gap-3">
          {(['short', 'medium', 'detailed'] as const).map((length) => (
            <button
              key={length}
              onClick={() => setConfig({ ...config, length })}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                config.length === length
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40'
              }`}
            >
              <div className="text-white font-medium capitalize">{length}</div>
              <div className="text-xs text-blue-300 mt-1">
                {length === 'short' && '500-800 words'}
                {length === 'medium' && '1000-1500 words'}
                {length === 'detailed' && '1500-2500 words'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-pink-400 hover:text-pink-300 text-sm font-medium"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>

      {showAdvanced && (
        <>
          {/* Section Toggles */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Include Sections</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(config.includeSections || {}).map(([section, included]) => (
                <label key={section} className="flex items-center space-x-3 p-3 rounded-lg bg-black/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        includeSections: {
                          summary: true,
                          skillThemes: true,
                          timeline: true,
                          strengths: true,
                          highlights: true,
                          careerPaths: true,
                          mediaShowcase: false,
                          ...config.includeSections,
                          [section]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 rounded border-pink-500/30 bg-black/30 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="text-white capitalize">
                    {section.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Focus Skills */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Focus Skills</h3>
            <p className="text-sm text-pink-300 mb-4">Comma-separated skills to emphasize</p>
            <input
              type="text"
              value={focusSkillsInput}
              onChange={(e) => setFocusSkillsInput(e.target.value)}
              placeholder="e.g., React, TypeScript, Leadership"
              className="w-full p-3 rounded-lg bg-black/30 border border-pink-500/30 text-white placeholder-pink-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Custom Instructions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Custom Instructions</h3>
            <p className="text-sm text-pink-300 mb-4">Additional guidance for the AI</p>
            <textarea
              value={customPromptInput}
              onChange={(e) => setCustomPromptInput(e.target.value)}
              placeholder="e.g., Focus on my leadership experience and international work..."
              rows={4}
              className="w-full p-3 rounded-lg bg-black/30 border border-pink-500/30 text-white placeholder-pink-400/50 focus:outline-none focus:border-pink-500 resize-none"
            />
          </div>
        </>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={loading || generating}
        className="w-full py-6 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
      >
        {loading || generating ? '✨ Generating...' : '🚀 Generate TalentStory'}
      </Button>
    </div>
  );
}
