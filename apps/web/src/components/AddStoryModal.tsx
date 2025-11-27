/**
 * AddStoryModal - Sprint 2.4
 * 
 * Modal for creating a new STAR-format story. Supports:
 * 1. Manual entry mode with STAR guidance prompts
 * 2. AI generation mode from bullet points
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, FileText, Plus, X } from 'lucide-react';
import type { AddStoryModalProps } from '@/lib/storyTypes';
import { DEFAULT_STAR_TEMPLATE } from '@/lib/storyTypes';

export function AddStoryModal({
  experienceId,
  experienceTitle,
  onClose,
  onSuccess,
}: AddStoryModalProps) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'ai'>('choose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual entry state
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  // AI generation state
  const [bullets, setBullets] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  const handleManualCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_id: experienceId,
          title: title || `Story for ${experienceTitle}`,
          situation,
          task,
          action,
          result,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create story');
      }

      const { story } = await response.json();
      onSuccess(story.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    // Filter out empty bullets
    const validBullets = bullets.filter((b) => b.trim().length > 0);

    if (validBullets.length === 0) {
      setError('Please add at least one bullet point');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_id: experienceId,
          bullets: validBullets,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate story');
      }

      const { story_id } = await response.json();
      onSuccess(story_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story');
    } finally {
      setIsLoading(false);
    }
  };

  const addBullet = () => {
    setBullets([...bullets, '']);
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    setBullets(newBullets);
  };

  const removeBullet = (index: number) => {
    if (bullets.length > 1) {
      setBullets(bullets.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a New Story</DialogTitle>
          <DialogDescription>
            Create a STAR-format narrative for <strong>{experienceTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selection */}
        {mode === 'choose' && (
          <div className="space-y-4 py-6">
            <Button
              onClick={() => setMode('ai')}
              className="w-full h-auto flex flex-col items-start p-6 text-left"
              variant="outline"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <span className="text-lg font-semibold">AI-Powered Generation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Provide bullet points about what you did, and AI will craft a compelling STAR story for you.
              </p>
            </Button>

            <Button
              onClick={() => setMode('manual')}
              className="w-full h-auto flex flex-col items-start p-6 text-left"
              variant="outline"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-semibold">Manual Entry</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Write your story yourself with guidance prompts for each STAR section.
              </p>
            </Button>
          </div>
        )}

        {/* Manual Entry Mode */}
        {mode === 'manual' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cloud Migration Success"
              />
            </div>

            {/* Situation */}
            <div className="space-y-2">
              <Label htmlFor="situation" className="flex items-center gap-2">
                <span className="font-semibold">Situation</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({DEFAULT_STAR_TEMPLATE.situation.prompt})
                </span>
              </Label>
              <Textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={DEFAULT_STAR_TEMPLATE.situation.example}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tips: {DEFAULT_STAR_TEMPLATE.situation.tips.join(' • ')}
              </p>
            </div>

            {/* Task */}
            <div className="space-y-2">
              <Label htmlFor="task" className="flex items-center gap-2">
                <span className="font-semibold">Task</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({DEFAULT_STAR_TEMPLATE.task.prompt})
                </span>
              </Label>
              <Textarea
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder={DEFAULT_STAR_TEMPLATE.task.example}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Tips: {DEFAULT_STAR_TEMPLATE.task.tips.join(' • ')}
              </p>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label htmlFor="action" className="flex items-center gap-2">
                <span className="font-semibold">Action</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({DEFAULT_STAR_TEMPLATE.action.prompt})
                </span>
              </Label>
              <Textarea
                id="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder={DEFAULT_STAR_TEMPLATE.action.example}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Tips: {DEFAULT_STAR_TEMPLATE.action.tips.join(' • ')}
              </p>
            </div>

            {/* Result */}
            <div className="space-y-2">
              <Label htmlFor="result" className="flex items-center gap-2">
                <span className="font-semibold">Result</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({DEFAULT_STAR_TEMPLATE.result.prompt})
                </span>
              </Label>
              <Textarea
                id="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder={DEFAULT_STAR_TEMPLATE.result.example}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Tips: {DEFAULT_STAR_TEMPLATE.result.tips.join(' • ')}
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {/* AI Generation Mode */}
        {mode === 'ai' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Bullet Points</Label>
              <p className="text-sm text-muted-foreground mb-3">
                List what you accomplished in this role. Include numbers and results!
              </p>
              <div className="space-y-2">
                {bullets.map((bullet, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={bullet}
                      onChange={(e) => updateBullet(index, e.target.value)}
                      placeholder={`e.g., ${index === 0 ? 'Reduced deployment time by 60%' : index === 1 ? 'Led team of 5 engineers' : 'Saved $200K annually'}`}
                    />
                    {bullets.length > 1 && (
                      <Button
                        onClick={() => removeBullet(index)}
                        variant="ghost"
                        size="icon"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={addBullet}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Bullet
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Context (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details you want AI to consider..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          {mode === 'choose' ? null : (
            <>
              <Button
                onClick={() => setMode('choose')}
                variant="ghost"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={mode === 'manual' ? handleManualCreate : handleAIGenerate}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'manual' ? 'Create Story' : 'Generate with AI'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
