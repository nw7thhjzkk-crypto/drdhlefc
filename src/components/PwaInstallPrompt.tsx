'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsReadyForInstall(true);
    });
  }, []);

  async function installPwa() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsReadyForInstall(false);
    }
    setDeferredPrompt(null);
  }

  if (!isReadyForInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg flex justify-between items-center z-50">
      <div>
        <h4 className="font-bold">Install App</h4>
        <p className="text-sm">Install DR DHL Elite Fitness Club for a better experience.</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsReadyForInstall(false)}
          className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
        >
          Later
        </button>
        <button
          onClick={installPwa}
          className="px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-500 font-bold"
        >
          Install
        </button>
      </div>
    </div>
  );
}
