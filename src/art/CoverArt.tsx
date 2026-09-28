import { type CSSProperties, memo, useId, useRef } from 'react';
import type { ArtSpec } from '@/content/types';
import { cn } from '@/lib/utils';
import { Landscape } from './landscape';
import { useArtworkActivity } from './useArtworkActivity';
import { usePlayer } from '@/store/player';

interface Props {
  spec: ArtSpec;
  ratio?: number;
  className?: string;
  rounded?: string;
  grain?: boolean;
  /** Animate the illustration while visible. Opt out for a still preview. */
  live?: boolean;
}

export const CoverArt = memo(function CoverArt({ spec, ratio = 1, className, rounded = 'rounded-2xl', grain = false, live = true }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const covered = usePlayer((s) => s.expanded && Boolean(s.item));
  const { active, inView } = useArtworkActivity(ref, !live || covered);
  return (
    <div
      ref={ref}
      className={cn('cover-art relative overflow-hidden', live && 'living-art', rounded, grain && 'grain', className)}
      data-art-active={active}
      data-art-visible={inView}
      data-motif={spec.motif}
      style={{ contain: 'paint', '--art-play-state': active ? 'running' : 'paused' } as CSSProperties}
    >
      <Landscape spec={spec} ratio={ratio} uid={uid} />
    </div>
  );
});
