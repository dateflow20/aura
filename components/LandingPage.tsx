
import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const FEATURE_SNIPPETS = [
  { id: 1, title: 'Neural Registry', detail: 'Automated intent extraction', side: 'left', top: '10%', color: 'border-emerald-500/30 text-emerald-400 shadow-emerald-500/20 bg-emerald-500/5' },
  { id: 2, title: 'Temporal Node', detail: 'Real-time calendar resonance', side: 'right', top: '15%', color: 'border-cyan-500/30 text-cyan-400 shadow-cyan-500/20 bg-cyan-500/5' },
  { id: 3, title: 'Cognitive Sync', detail: 'Voice-first intelligence', side: 'left', top: '75%', color: 'border-amber-500/30 text-amber-400 shadow-amber-500/20 bg-amber-500/5' },
  { id: 4, title: 'Deep Logic', detail: 'Decomposition heuristic', side: 'right', top: '80%', color: 'border-rose-500/30 text-rose-400 shadow-rose-500/20 bg-rose-500/5' },
  { id: 5, title: 'Audio Memory', detail: 'Signal playback loops', side: 'left', top: '5%', color: 'border-indigo-500/30 text-indigo-400 shadow-indigo-500/20 bg-indigo-500/5' },
  { id: 6, title: 'Visual Scanner', detail: 'Optical node capture', side: 'right', top: '85%', color: 'border-violet-500/30 text-violet-400 shadow-violet-500/20 bg-violet-500/5' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    let timeout: number;
    const loop = async () => {
      while (true) {
        setIsShowing(true);
        await new Promise(r => timeout = window.setTimeout(r, 4000));
        setIsShowing(false);
        await new Promise(r => timeout = window.setTimeout(r, 1200)); 
        setActiveSnippet(prev => (prev + 1) % FEATURE_SNIPPETS.length);
      }
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col items-center justify-center font-['Inter']">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(25,25,25,1)_0%,rgba(0,0,0,1)_100%)]" />
      
      {/* Lateral Neural Fragments (Depth Layer) */}
      <div className="absolute inset-0 pointer-events-none">
        {FEATURE_SNIPPETS.map((snippet, i) => (
          <div 
            key={snippet.id}
            className={`absolute p-6 sm:p-10 border rounded-[2rem] sm:rounded-[3rem] backdrop-blur-3xl transition-all duration-[1500ms] ease-out shadow-2xl ${
              snippet.side === 'left' ? 'left-4 sm:left-32' : 'right-4 sm:right-32'
            } ${snippet.color} ${activeSnippet === i && isShowing ? 'opacity-60 translate-x-0 scale-100' : 'opacity-0 scale-95 ' + (snippet.side === 'left' ? '-translate-x-20' : 'translate-x-20')}`}
            style={{ 
              top: snippet.top, 
              width: 'calc(100% - 2rem)',
              maxWidth: '280px' 
            }}
          >
            <div className="w-12 h-[2px] bg-current opacity-30 mb-4 rounded-full" />
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.6em] mb-1 block opacity-80">{snippet.title}</span>
            <p className="text-sm sm:text-base font-bold text-white/80 leading-tight italic">"{snippet.detail}"</p>
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-16 sm:gap-24 text-center px-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 sm:mb-10">
            {['A', 'U', 'R', 'A'].map((char, i) => (
              <span 
                key={i} 
                className="text-8xl sm:text-[11rem] font-black tracking-tighter uppercase leading-none inline-block animate-float-char"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {char}
              </span>
            ))}
          </div>
          <p className="text-zinc-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[1em] sm:tracking-[1.2em] ml-[1em] sm:ml-[1.2em] animate-pulse">
            Neural Ecosystem
          </p>
        </div>

        <button 
          onClick={onStart}
          className="group relative px-10 sm:px-16 py-5 sm:py-7 bg-transparent border border-white/5 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-[0.8em] overflow-hidden transition-all hover:border-white/30 hover:scale-105 active:scale-95 shadow-2xl"
        >
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]" />
          <span className="relative z-10 group-hover:text-black transition-colors duration-700">Initialize Uplink</span>
        </button>
      </div>

      <style>{`
        @keyframes float-char {
          0%, 100% { transform: translateY(0) rotate(0deg); text-shadow: 0 0 0px transparent; }
          33% { transform: translateY(-15px) rotate(-1deg); text-shadow: 0 10px 20px rgba(255,255,255,0.05); }
          66% { transform: translateY(5px) rotate(1deg); text-shadow: 0 -5px 10px rgba(255,255,255,0.05); }
        }
        .animate-float-char {
          animation: float-char 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
