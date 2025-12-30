import React from 'react';

interface NewYearPopupProps {
    onStart: () => void;
    onDismiss: () => void;
}

const NewYearPopup: React.FC<NewYearPopupProps> = ({ onStart, onDismiss }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onDismiss} />

            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Decorative Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
                        <span className="text-3xl">✨</span>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">2026 Vision</h2>
                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                        Initialize your neural registry for the new year. Define your long-term signals and let GTD architect your path to success.
                    </p>

                    <button
                        onClick={onStart}
                        className="w-full py-4 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all mb-4"
                    >
                        Generate Plan
                    </button>

                    <button
                        onClick={onDismiss}
                        className="text-xs font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors"
                    >
                        Remind Me Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewYearPopup;
