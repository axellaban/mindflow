import { NARRATORS, SESSION_BY_ID, sessionKindLabel } from '@/content/catalog';
import { MUSIC_BY_ID } from '@/content/sounds';
import type { ArtSpec, Session } from '@/content/types';
import type { PlayerItem } from '@/store/player';

export interface ItemInfo {
  key: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  art: ArtSpec;
  session?: Session;
  sleep: boolean;
  infinite: boolean;
  description?: string;
}

export function itemInfo(item: PlayerItem): ItemInfo {
  if (item.type === 'session') {
    const s = SESSION_BY_ID[item.id]!;
    return {
      key: `session:${s.id}`,
      title: s.title,
      subtitle: `${NARRATORS[s.narrator].name} · ${s.subtitle}`,
      eyebrow: sessionKindLabel(s),
      art: s.art,
      session: s,
      sleep: Boolean(s.sleep),
      infinite: false,
      description: s.description,
    };
  }
  if (item.type === 'music') {
    const m = MUSIC_BY_ID[item.id];
    return {
      key: `music:${m.id}`,
      title: m.title,
      subtitle: m.subtitle,
      eyebrow: m.kind === 'binaural' ? 'Ondas binaurales' : 'Música',
      art: m.art,
      sleep: m.mood === 'dormir',
      infinite: true,
      description: m.description,
    };
  }
  return {
    key: `mix:${item.id}`,
    title: item.name,
    subtitle: 'Paisaje sonoro',
    eyebrow: 'Sonidos',
    art: item.art,
    sleep: true,
    infinite: true,
  };
}
