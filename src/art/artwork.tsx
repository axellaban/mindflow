import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { ArtSpec } from '@/content/types';
import { Landscape } from './landscape';

const cache = new Map<string, Promise<string | null>>();

/**
 * Rasterizes a cover to a square JPEG (blob URL) for the lock screen and the
 * system media controls. Resolves to null when the browser can't do it, so the
 * caller keeps the app icon.
 */
export function coverImage(spec: ArtSpec, size = 512): Promise<string | null> {
  const key = `${spec.palette}:${spec.motif}:${spec.seed}:${size}`;
  let job = cache.get(key);
  if (!job) {
    job = idle()
      .then(() => rasterize(spec, size))
      .catch(() => null);
    cache.set(key, job);
  }
  return job;
}

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 1500 });
    else setTimeout(resolve, 120);
  });
}

async function rasterize(spec: ArtSpec, size: number): Promise<string | null> {
  const host = document.createElement('div');
  const root = createRoot(host);
  let markup = '';
  try {
    flushSync(() => root.render(<Landscape spec={spec} ratio={1} uid="cover" />));
    const svg = host.querySelector('svg');
    if (!svg) return null;
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    markup = new XMLSerializer().serializeToString(svg);
  } finally {
    root.unmount();
  }

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('cover'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  return blob ? URL.createObjectURL(blob) : null;
}
