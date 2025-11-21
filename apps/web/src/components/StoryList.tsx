/**
 * StoryList - Sprint 2.4
 * 
 * List all stories for an experience with:
 * - Add new story button
 * - Filtering (drafts, published, AI-generated)
 * - Sorting
 */

'use client';

import { useState, useEffect } from 'react';
import { StoryCard } from './StoryCard';
import { AddStoryModal } from './AddStoryModal';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import type { StoryWithDetails } from '@/lib/storyTypes';

interface StoryListProps {
  experienceId: string;
  experienceTitle: string;
  onEditStory?: (storyId: string) => void;
}

export function StoryList({
  experienceId,
  experienceTitle,
  onEditStory,
}: StoryListProps) {
  const [stories, setStories] = useState<StoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stories/by-experience/${experienceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const { stories: fetchedStories } = await response.json();
      setStories(fetchedStories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [experienceId]);

  const handleStoryCreated = (storyId: string) => {
    setShowAddModal(false);
    fetchStories(); // Refresh list
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      // Remove from local state
      setStories(stories.filter((s) => s.id !== storyId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete story');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchStories} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stories</h2>
          <p className="text-muted-foreground">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} for {experienceTitle}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Story
        </Button>
      </div>

      {/* Story Cards */}
      {stories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No stories yet. Create your first STAR story!
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Story
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onEdit={onEditStory}
              onDelete={handleDelete}
              defaultCollapsed={false}
            />
          ))}
        </div>
      )}

      {/* Add Story Modal */}
      {showAddModal && (
        <AddStoryModal
          experienceId={experienceId}
          experienceTitle={experienceTitle}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleStoryCreated}
        />
      )}
    </div>
  );
}
