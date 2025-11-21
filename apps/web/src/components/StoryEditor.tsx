/**
 * StoryEditor - Sprint 2.4
 * 
 * Rich text editor for STAR stories using TipTap with:
 * - 2.5 second debounced autosave
 * - Character count
 * - Save status indicator
 * - Section-based editing (Situation, Task, Action, Result)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Save,
  Check,
  AlertCircle,
  History,
  X,
} from 'lucide-react';
import type { StoryEditorProps, AutosaveStatus } from '@/lib/storyTypes';
import { DEFAULT_STAR_TEMPLATE } from '@/lib/storyTypes';

const AUTOSAVE_DELAY = 2500; // 2.5 seconds

export function StoryEditor({
  storyId,
  initialContent,
  onSave,
  onClose,
}: StoryEditorProps) {
  const [story, setStory] = useState(initialContent || {});
  const [title, setTitle] = useState(initialContent?.title || '');
  const [isDraft, setIsDraft] = useState(initialContent?.is_draft ?? true);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'saved',
  });
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Individual editors for each STAR section
  const situationEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: DEFAULT_STAR_TEMPLATE.situation.prompt,
      }),
      CharacterCount,
    ],
    content: initialContent?.situation || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      handleContentChange('situation', editor.getHTML());
    },
  });

  const taskEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: DEFAULT_STAR_TEMPLATE.task.prompt,
      }),
      CharacterCount,
    ],
    content: initialContent?.task || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      handleContentChange('task', editor.getHTML());
    },
  });

  const actionEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: DEFAULT_STAR_TEMPLATE.action.prompt,
      }),
      CharacterCount,
    ],
    content: initialContent?.action || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      handleContentChange('action', editor.getHTML());
    },
  });

  const resultEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: DEFAULT_STAR_TEMPLATE.result.prompt,
      }),
      CharacterCount,
    ],
    content: initialContent?.result || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      handleContentChange('result', editor.getHTML());
    },
  });

  const handleContentChange = useCallback(
    (field: string, value: string) => {
      setStory((prev) => ({ ...prev, [field]: value }));
      setAutosaveStatus({ status: 'unsaved' });

      // Clear existing timeout
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }

      // Set new timeout for autosave
      const timeoutId = setTimeout(() => {
        performAutosave({ [field]: value });
      }, AUTOSAVE_DELAY);

      setSaveTimeoutId(timeoutId);
    },
    [saveTimeoutId]
  );

  const performAutosave = async (updates: Record<string, string>) => {
    setAutosaveStatus({ status: 'saving' });

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          title,
          is_draft: isDraft,
          autosave: true, // Don't create version snapshot
        }),
      });

      if (!response.ok) {
        throw new Error('Autosave failed');
      }

      const { story: updatedStory } = await response.json();
      setStory(updatedStory);
      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
      });

      onSave?.(updatedStory);
    } catch (error) {
      setAutosaveStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to save',
      });
    }
  };

  const handleManualSave = async () => {
    setAutosaveStatus({ status: 'saving' });

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: situationEditor?.getHTML() || '',
          task: taskEditor?.getHTML() || '',
          action: actionEditor?.getHTML() || '',
          result: resultEditor?.getHTML() || '',
          title,
          is_draft: isDraft,
          autosave: false, // Create version snapshot
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const { story: updatedStory } = await response.json();
      setStory(updatedStory);
      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
      });

      onSave?.(updatedStory);
    } catch (error) {
      setAutosaveStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to save',
      });
    }
  };

  const handlePublish = async () => {
    setIsDraft(false);
    await handleManualSave();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [saveTimeoutId]);

  const renderSaveStatus = () => {
    switch (autosaveStatus.status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Saved
            {autosaveStatus.lastSaved && (
              <span className="text-xs text-muted-foreground">
                {autosaveStatus.lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Unsaved changes
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {autosaveStatus.error}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleContentChange('title', e.target.value);
            }}
            placeholder="Story Title"
            className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex items-center gap-4">
          {renderSaveStatus()}
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* STAR Sections */}
      <div className="space-y-6">
        {/* Situation */}
        <Card className="p-4">
          <Label className="text-lg font-semibold mb-2 block">
            Situation
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            {DEFAULT_STAR_TEMPLATE.situation.prompt}
          </p>
          <EditorContent
            editor={situationEditor}
            className="prose prose-sm max-w-none min-h-[100px] focus:outline-none"
          />
          {situationEditor && (
            <div className="text-xs text-muted-foreground mt-2">
              {situationEditor.storage.characterCount.characters()} characters
            </div>
          )}
        </Card>

        {/* Task */}
        <Card className="p-4">
          <Label className="text-lg font-semibold mb-2 block">Task</Label>
          <p className="text-sm text-muted-foreground mb-3">
            {DEFAULT_STAR_TEMPLATE.task.prompt}
          </p>
          <EditorContent
            editor={taskEditor}
            className="prose prose-sm max-w-none min-h-[80px] focus:outline-none"
          />
          {taskEditor && (
            <div className="text-xs text-muted-foreground mt-2">
              {taskEditor.storage.characterCount.characters()} characters
            </div>
          )}
        </Card>

        {/* Action */}
        <Card className="p-4">
          <Label className="text-lg font-semibold mb-2 block">Action</Label>
          <p className="text-sm text-muted-foreground mb-3">
            {DEFAULT_STAR_TEMPLATE.action.prompt}
          </p>
          <EditorContent
            editor={actionEditor}
            className="prose prose-sm max-w-none min-h-[120px] focus:outline-none"
          />
          {actionEditor && (
            <div className="text-xs text-muted-foreground mt-2">
              {actionEditor.storage.characterCount.characters()} characters
            </div>
          )}
        </Card>

        {/* Result */}
        <Card className="p-4">
          <Label className="text-lg font-semibold mb-2 block">Result</Label>
          <p className="text-sm text-muted-foreground mb-3">
            {DEFAULT_STAR_TEMPLATE.result.prompt}
          </p>
          <EditorContent
            editor={resultEditor}
            className="prose prose-sm max-w-none min-h-[80px] focus:outline-none"
          />
          {resultEditor && (
            <div className="text-xs text-muted-foreground mt-2">
              {resultEditor.storage.characterCount.characters()} characters
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          View Versions
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleManualSave} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Version
          </Button>
          {isDraft && (
            <Button onClick={handlePublish}>Publish Story</Button>
          )}
        </div>
      </div>
    </div>
  );
}
