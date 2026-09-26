import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last line of defence: never leave people staring at a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-900 px-8 text-center">
        <div className="size-20 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #f0a9bd 60%, #a8c5b2)' }} />
        <h1 className="mt-8 font-display text-[30px] leading-tight">Algo se desordenó</h1>
        <p className="mt-2 max-w-xs text-[15px] text-2">Respirá. Tu progreso está a salvo en este dispositivo. Recargá para continuar.</p>
        <button
          type="button"
          onClick={() => location.assign('/')}
          className="mt-8 h-12 rounded-full bg-mist-50 px-8 text-[15px] font-semibold text-ink-900"
        >
          Volver a empezar
        </button>
      </div>
    );
  }
}
