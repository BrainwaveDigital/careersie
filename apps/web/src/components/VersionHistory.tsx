/**
 * VersionHistory - Sprint 2.4
 * 
 * Version control UI for stories:
 * - List all versions
 * - Compare versions
 * - Restore previous versions
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, History, RotateCcw, Sparkles } from 'lucide-react';
import type { StoryVersion } from '@/lib/storyTypes';

interface VersionHistoryProps {
  storyId: string;
  open: boolean;
  onClose: () => void;
  onRestore?: (version: StoryVersion) => void;
}

export function VersionHistory({
  storyId,
  open,
  onClose,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<StoryVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<StoryVersion | null>(null);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, storyId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stories/${storyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }

      const { story } = await response.json();
      setVersions(story.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = (version: StoryVersion) => {
    if (confirm(`Restore version ${version.version_number}?`)) {
      onRestore?.(version);
      onClose();
    }
  };

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this story
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No version history available
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <Card
                key={version.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedVersion?.id === version.id
                    ? 'border-primary'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        Version {version.version_number}
                      </Badge>
                      {version.created_by_ai && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                    {version.change_summary && (
                      <p className="text-sm mt-1">{version.change_summary}</p>
                    )}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(version);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </div>

                {selectedVersion?.id === version.id && (
                  <div className="space-y-3 pt-3 border-t">
                    {version.situation && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">
                          SITUATION
                        </h5>
                        <p className="text-sm">{stripHtml(version.situation)}</p>
                      </div>
                    )}
                    {version.task && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">
                          TASK
                        </h5>
                        <p className="text-sm">{stripHtml(version.task)}</p>
                      </div>
                    )}
                    {version.action && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">
                          ACTION
                        </h5>
                        <p className="text-sm">{stripHtml(version.action)}</p>
                      </div>
                    )}
                    {version.result && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-1">
                          RESULT
                        </h5>
                        <p className="text-sm">{stripHtml(version.result)}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
