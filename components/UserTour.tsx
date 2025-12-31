import React, { useState } from 'react';

interface TourStep {
    target: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'center';
}

interface UserTourProps {
    onComplete: () => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        target: 'voice-trigger',
        title: 'Neural Signal',
        content: 'Tap the central node to speak your intentions. Aura will distill your words into actionable signals.',
        position: 'center'
    },
    {
        target: 'nav-list',
        title: 'Goal Registry',
        content: 'Access your organized tasks here. Signals are categorized into Today, Hidden, and Finished states.',
        position: 'bottom'
    },
    {
        target: 'nav-scan',
        title: 'Optical Scanner',
        content: 'Synchronize physical notes or vision boards directly into your neural registry using the camera.',
        position: 'bottom'
    },
    {
        target: 'nav-chat',
        title: 'Neural Dialogue',
        content: 'Engage in deep conversation with Aura to refine your focus or break down complex objectives.',
        position: 'bottom'
    },
    {
        target: 'year-button',
        title: '2026 Vision',
        content: 'Access your yearly dashboard to manage long-term goals and toggle the Neural Auto-Architect.',
        position: 'top'
    }
];

const UserTour: React.FC<UserTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const step = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full" />

                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">System Orientation</span>
                            <span className="text-[10px] font-black text-zinc-700">{currentStep + 1} / {TOUR_STEPS.length}</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{step.title}</h2>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                        {step.content}
                    </p>

                    <div className="pt-4 flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-full font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-[2] py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            {currentStep === TOUR_STEPS.length - 1 ? 'Initialize System' : 'Next Protocol'}
                        </button>
                    </div>
                </div>

                {/* Progress Dots */}
                <div className="mt-8 flex justify-center gap-2">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-zinc-800'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserTour;
