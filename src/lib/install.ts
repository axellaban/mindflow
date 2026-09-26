import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
  install: () => Promise<boolean>;
}

export const useInstall = create<InstallState>()((set, get) => ({
  deferred: null,
  installed: false,
  install: async () => {
    const e = get().deferred;
    if (!e) return false;
    await e.prompt();
    const choice = await e.userChoice;
    set({ deferred: null, installed: choice.outcome === 'accepted' });
    return choice.outcome === 'accepted';
  },
}));

export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    useInstall.setState({ deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ installed: true, deferred: null }));
}
