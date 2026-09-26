import { memo, useId } from 'react';
import type { ArtSpec } from '@/content/types';
import { cn } from '@/lib/utils';
import { Landscape } from './landscape';

interface Props {
  spec: ArtSpec;
  ratio?: number;
  className?: string;
  rounded?: string;
  grain?: boolean;
  /** A slow drift across the artwork, for large covers. */
  live?: boolean;
}

export const CoverArt = memo(function CoverArt({ spec, ratio = 1, className, rounded = 'rounded-2xl', grain = false, live = false }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={cn('relative overflow-hidden', rounded, grain && 'grain', className)} style={{ contain: 'paint' }}>
      {live ? (
        <div className="kenburns absolute inset-0">
          <Landscape spec={spec} ratio={ratio} uid={uid} />
        </div>
      ) : (
        <Landscape spec={spec} ratio={ratio} uid={uid} />
      )}
    </div>
  );
});
