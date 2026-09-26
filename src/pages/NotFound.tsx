import { useNavigate } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <CoverArt spec={{ palette: 'mist', motif: 'path', seed: 404 }} className="size-40" />
      <h1 className="mt-8 font-display text-[34px] leading-tight">Este camino no lleva a ningún lado</h1>
      <p className="mt-2 text-[15px] text-2">Respirá. Volvamos a un lugar conocido.</p>
      <Button size="lg" className="mt-8" onClick={() => navigate('/')}>
        Ir al inicio
      </Button>
    </div>
  );
}
