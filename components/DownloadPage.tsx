import React, { useState, useEffect } from 'react';

const DownloadPage: React.FC<{ onUseWeb: () => void }> = ({ onUseWeb }) => {
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        }
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-['Inter']">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,15,15,1)_0%,rgba(0,0,0,1)_100%)]" />

            <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl font-black text-black">A</span>
                    </div>

                    <h1 className="text-6xl font-black uppercase tracking-tighter">
                        Download AURA
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
                        Neural AI Companion • Voice-First Productivity • Adaptive Learning
                    </p>
                </div>

                {/* Platform Detection */}
                {platform !== 'other' && (
                    <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                        <p className="text-sm text-blue-400">
                            ⚡ {platform === 'ios' ? 'iPhone' : 'Android'} detected - Recommended version highlighted below
                        </p>
                    </div>
                )}

                {/* Download Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* iOS Card */}
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${platform === 'ios'
                            ? 'border-white bg-white/5 scale-105'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}>
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">iOS App</h3>
                                <p className="text-sm text-zinc-500 mt-2">For iPhone & iPad</p>
                            </div>

                            <div className="space-y-3 text-left bg-zinc-900/50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Full offline support</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Native performance</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Face ID / Touch ID</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = '/downloads/aura-ios.ipa'}
                                className="w-full py-4 rounded-[1.5rem] bg-white text-black font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Download for iOS
                            </button>

                            <p className="text-xs text-zinc-600">
                                Or install via <a href="https://testflight.apple.com" className="text-blue-500 hover:underline">TestFlight</a>
                            </p>
                        </div>
                    </div>

                    {/* Android Card */}
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${platform === 'android'
                            ? 'border-white bg-white/5 scale-105'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}>
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.6 10.5l2.4-4.2c.1-.2 0-.5-.2-.6-.2-.1-.5 0-.6.2l-2.4 4.2C15.5 9.4 13.8 9 12 9s-3.5.4-4.8 1.1L4.8 5.9c-.1-.2-.4-.3-.6-.2-.2.1-.3.4-.2.6l2.4 4.2C3.5 12.1 1.5 14.9 1 18h22c-.5-3.1-2.5-5.9-5.4-7.5zM7 15.25c-.7 0-1.25-.6-1.25-1.25s.6-1.25 1.25-1.25S8.25 13.4 8.25 14 7.7 15.25 7 15.25zm10 0c-.7 0-1.25-.6-1.25-1.25s.6-1.25 1.25-1.25 1.25.6 1.25 1.25-.6 1.25-1.25 1.25z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Android App</h3>
                                <p className="text-sm text-zinc-500 mt-2">For Android devices</p>
                            </div>

                            <div className="space-y-3 text-left bg-zinc-900/50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Full offline support</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Native performance</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    <span className="text-zinc-400">Fingerprint login</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = '/downloads/aura-android.apk'}
                                className="w-full py-4 rounded-[1.5rem] bg-white text-black font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Download APK
                            </button>

                            <p className="text-xs text-zinc-600">
                                Or get it on <a href="https://play.google.com" className="text-blue-500 hover:underline">Google Play</a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Web Version */}
                <div className="text-center">
                    <div className="p-6 rounded-[2rem] border border-zinc-800 bg-zinc-900/30 inline-block">
                        <p className="text-sm text-zinc-400 mb-4">Don't want to download? Use the web version:</p>
                        <button
                            onClick={onUseWeb}
                            className="px-8 py-3 rounded-xl border-2 border-zinc-700 hover:border-white hover:bg-white hover:text-black font-black text-xs uppercase tracking-wider transition-all"
                        >
                            🌐 Launch Web App
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-zinc-600 space-y-2">
                    <p>Version 1.0.0 • 25MB • Requires iOS 14+ or Android 8+</p>
                    <p>© 2025 AURA Neural System • All rights reserved</p>
                </div>
            </div>
        </div>
    );
};

export default DownloadPage;
