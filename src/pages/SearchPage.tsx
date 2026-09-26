import { Search, Wind, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MusicCard, Rail, SessionRow } from '@/components/cards';
import { Chip } from '@/components/ui/controls';
import { BREATH_PATTERNS } from '@/content/breathing';
import { CATEGORY_BY_ID, SESSIONS } from '@/content/catalog';
import { MUSIC } from '@/content/sounds';
import { PageHeader } from './PageHeader';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const SUGGESTIONS = ['ansiedad', 'dormir', 'estrés', 'enfoque', 'gratitud', 'cuerpo', 'historia', 'respiración', 'mañana'];

export function SearchPage() {
  const [q, setQ] = useState('');
  const terms = norm(q).split(/\s+/).filter(Boolean);

  const results = useMemo(() => {
    if (!terms.length) return null;
    const match = (text: string) => {
      const t = norm(text);
      return terms.every((term) => t.includes(term));
    };
    const sessions = SESSIONS.filter((s) =>
      match(
        [
          s.title,
          s.subtitle,
          s.description,
          s.daily?.theme ?? '',
          s.kind === 'story' ? 'historia dormir cuento' : '',
          ...s.categories.map((c) => CATEGORY_BY_ID[c].name),
          s.categories.includes('sueno') ? 'dormir noche insomnio' : '',
        ].join(' '),
      ),
    );
    const music = MUSIC.filter((m) => match(`${m.title} ${m.subtitle} ${m.description} musica sonido`));
    const breath = BREATH_PATTERNS.filter((b) => match(`${b.name} ${b.benefit} ${b.description} respiracion respirar`));
    return { sessions, music, breath };
  }, [terms.join(' ')]);

  const empty = results && !results.sessions.length && !results.music.length && !results.breath.length;

  return (
    <div className="pb-12">
      <PageHeader title="Buscar" back />
      <div className="px-5 md:px-0">
        <label className="glass flex h-14 items-center gap-3 rounded-full px-5">
          <Search className="size-5 text-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ansiedad, dormir, respiración…"
            className="h-full flex-1 bg-transparent text-[16px] outline-none placeholder:text-mist-50/35"
            enterKeyHint="search"
            aria-label="Buscar"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Borrar búsqueda" className="text-3 hover:text-mist-50">
              <X className="size-5" />
            </button>
          )}
        </label>
      </div>

      {!results && (
        <div className="mt-8 px-5 md:px-0">
          <p className="mb-3 text-[13px] font-semibold text-3">Sugerencias</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Chip key={s} onClick={() => setQ(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {empty && (
        <p className="mt-12 px-5 text-center text-[15px] text-2">
          No encontramos nada para “{q}”. Prueba con otra palabra, como <button type="button" className="underline" onClick={() => setQ('calma')}>calma</button>.
        </p>
      )}

      {results && !empty && (
        <div className="mt-6 space-y-8">
          {results.breath.length > 0 && (
            <div className="px-5 md:px-0">
              <p className="mb-2 text-[13px] font-semibold text-3">Respiración</p>
              <div className="flex flex-wrap gap-2">
                {results.breath.map((b) => (
                  <Link key={b.id} to={`/respirar?patron=${b.id}`} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold">
                    <Wind className="size-4" />
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.sessions.length > 0 && (
            <div className="px-3 md:px-0">
              <p className="mb-1 px-2 text-[13px] font-semibold text-3">{results.sessions.length} prácticas</p>
              {results.sessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
          {results.music.length > 0 && (
            <div>
              <p className="mb-2 px-5 text-[13px] font-semibold text-3 md:px-0">Música</p>
              <Rail>
                {results.music.map((m) => (
                  <MusicCard key={m.id} music={m} />
                ))}
              </Rail>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
