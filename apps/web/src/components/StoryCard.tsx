/**
 * StoryCard - Sprint 2.4
 * 
 * Display component for STAR stories with:
 * - Collapsible sections
 * - Metrics badges
 * - Edit/delete actions
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { StoryWithDetails } from '@/lib/storyTypes';

interface StoryCardProps {
  story: StoryWithDetails;
  onEdit?: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
  defaultCollapsed?: boolean;
}

export function StoryCard({
  story,
  onEdit,
  onDelete,
  defaultCollapsed = false,
}: StoryCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const renderMetrics = () => {
    if (!story.metrics?.numbers || story.metrics.numbers.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          Impact:
        </div>
        {story.metrics.numbers.map((metric, index) => (
          <Badge key={index} variant="secondary" className="font-mono">
            {metric}
          </Badge>
        ))}
      </div>
    );
  };

  const renderSkills = () => {
    if (!story.skills || story.skills.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {story.skills.map((skill) => (
          <Badge key={skill.id} variant="outline">
            {skill.skill}
          </Badge>
        ))}
      </div>
    );
  };

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">
              {story.title || 'Untitled Story'}
            </h3>
            {story.ai_generated && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </Badge>
            )}
            {story.is_draft && (
              <Badge variant="outline">Draft</Badge>
            )}
          </div>
          {story.experience && (
            <p className="text-sm text-muted-foreground">
              {story.experience.title} • {story.experience.company}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              onClick={() => onEdit(story.id)}
              variant="ghost"
              size="icon"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(story.id)}
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="icon"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Situation */}
          {story.situation && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                SITUATION
              </h4>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: story.situation }}
              />
            </div>
          )}

          {/* Task */}
          {story.task && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                TASK
              </h4>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: story.task }}
              />
            </div>
          )}

          {/* Action */}
          {story.action && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                ACTION
              </h4>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: story.action }}
              />
            </div>
          )}

          {/* Result */}
          {story.result && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                RESULT
              </h4>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: story.result }}
              />
            </div>
          )}

          {/* Metrics */}
          {renderMetrics()}

          {/* Skills */}
          {renderSkills()}

          {/* Version Info */}
          {story.versions && story.versions.length > 0 && (
            <div className="text-xs text-muted-foreground pt-3 border-t">
              {story.versions.length} version{story.versions.length !== 1 ? 's' : ''} •
              Last updated {new Date(story.updated_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Collapsed Preview */}
      {isCollapsed && story.full_story && (
        <div className="text-sm text-muted-foreground line-clamp-2">
          {stripHtml(story.full_story)}
        </div>
      )}
    </Card>
  );
}
