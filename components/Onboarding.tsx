
import React, { useState } from 'react';
import { UserProfile, GTDSettings, GTDTheme, EyeColor } from '../types';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>, settings: Partial<GTDSettings>) => void;
}

const THEMES: { id: GTDTheme; label: string; color: string }[] = [
  { id: 'venom', label: 'Venom', color: 'bg-zinc-900' },
  { id: 'neural-blue', label: 'Neural Blue', color: 'bg-blue-600' },
  { id: 'solar-gold', label: 'Solar Gold', color: 'bg-amber-600' },
  { id: 'deep-purple', label: 'Deep Purple', color: 'bg-purple-600' },
  { id: 'emerald-green', label: 'Emerald Green', color: 'bg-emerald-600' },
  { id: 'cosmic', label: 'Cosmic', color: 'bg-indigo-900' }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [theme, setTheme] = useState<GTDTheme>('venom');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({ name, focusArea }, { theme });
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6 font-['Inter']">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(15,15,15,1)_0%,rgba(0,0,0,1)_100%)]" />

      <div className="relative z-10 w-full max-w-lg space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 transition-all duration-500 ${step >= s ? 'w-8 bg-white' : 'w-4 bg-zinc-900'}`} />
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Step 0{step} / 03</span>
        </div>

        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="space-y-4">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Identity<br />Calibration</h2>
              <p className="text-zinc-500 text-sm font-medium">How should GTD address you during interactions?</p>
            </div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b-2 border-zinc-800 py-6 text-4xl font-black outline-none focus:border-white transition-all uppercase placeholder:text-zinc-900"
              placeholder="YOUR NAME"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="space-y-4">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Neural<br />Focus</h2>
              <p className="text-zinc-500 text-sm font-medium">What is your primary goal sector?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Professional', 'Personal', 'Academic', 'Creative'].map(focus => (
                <button
                  key={focus}
                  onClick={() => setFocusArea(focus)}
                  className={`py-6 px-4 rounded-[2rem] border text-xs font-black uppercase tracking-widest transition-all ${focusArea === focus ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="space-y-4">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">Visual<br />Resonance</h2>
              <p className="text-zinc-500 text-sm font-medium">Choose a theme for your interface.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-4 py-5 px-6 rounded-[2rem] border text-[10px] font-black uppercase tracking-widest transition-all ${theme === t.id ? 'bg-white text-black border-white shadow-xl' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-8 py-6 rounded-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={step === 1 ? !name : step === 2 ? !focusArea : false}
            className="flex-1 py-6 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 shadow-lg"
          >
            {step === 3 ? 'Finalize Uplink' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
