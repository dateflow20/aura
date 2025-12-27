import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Handle beforeinstallprompt event (Android/Desktop)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after 3 seconds delay
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, show instructions after delay
        if (iOS) {
            setTimeout(() => {
                setShowPrompt(true);
            }, 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            // iOS - show instructions
            if (isIOS) {
                setShowIOSInstructions(true);
            }
            return;
        }

        // Android/Desktop - trigger install
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Show again in 7 days
        localStorage.setItem('pwa_dismissed', Date.now().toString());
    };

    if (isInstalled || !showPrompt) return null;

    if (showIOSInstructions) {
        return (
            <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800">
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto">
                            <span className="text-3xl font-black text-black">A</span>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                                Install AURA
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Add to your home screen for the best experience
                            </p>
                        </div>

                        <div className="space-y-4 text-left bg-zinc-800/50 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white font-black text-sm">1</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Tap the Share button</p>
                                    <p className="text-zinc-400 text-xs mt-1">
                                        Look for <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg> in Safari's toolbar
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white font-black text-sm">2</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Add to Home Screen</p>
                                    <p className="text-zinc-400 text-xs mt-1">
                                        Scroll down and tap "Add to Home Screen"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-white font-black text-sm">3</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Confirm</p>
                                    <p className="text-zinc-400 text-xs mt-1">
                                        Tap "Add" in the top right corner
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            className="w-full py-4 rounded-[1.5rem] bg-white text-black font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-md mx-auto bg-zinc-900 rounded-[2rem] p-6 border-2 border-zinc-800 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-black text-black">A</span>
                    </div>

                    <div className="flex-1">
                        <h3 className="font-black text-white text-sm uppercase tracking-wide">Install AURA</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {isIOS ? 'Add to your home screen' : 'Get the app for faster access'}
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-3 mt-4">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 py-3 rounded-xl border-2 border-zinc-800 hover:border-zinc-700 font-black text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-all"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={handleInstall}
                        className="flex-1 py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isIOS ? 'Show How' : 'Install'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
