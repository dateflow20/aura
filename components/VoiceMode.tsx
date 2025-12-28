import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../services/audioUtils.ts';
import { Todo, AuraSettings, AuraTheme, EyeColor, ChatMessage, AuraVoice } from '../types.ts';

interface VoiceModeProps {
  onClose: () => void;
  todos: Todo[];
  initialHistory: ChatMessage[];
  onHistoryUpdate: (history: ChatMessage[]) => void;
  onTasksUpdated: (tasks: Todo[]) => void;
  onCalendarSynced: (msg: string) => void;
  onSettingsUpdate: (settings: AuraSettings) => void;
  settings: AuraSettings;
}

const THEME_CONFIG: Record<AuraTheme, { core: string; glow: string; backdrop: string; secondary: string }> = {
  'venom': { core: 'bg-zinc-800', glow: 'rgba(255, 255, 255, 0.05)', backdrop: 'bg-black', secondary: 'bg-zinc-900' },
  'neural-blue': { core: 'bg-blue-600', glow: 'rgba(59, 130, 246, 0.15)', backdrop: 'bg-slate-950', secondary: 'bg-blue-900/20' },
  'solar-gold': { core: 'bg-amber-500', glow: 'rgba(251, 191, 36, 0.15)', backdrop: 'bg-zinc-950', secondary: 'bg-amber-900/20' },
  'pure-white': { core: 'bg-zinc-300', glow: 'rgba(0, 0, 0, 0.05)', backdrop: 'bg-zinc-50', secondary: 'bg-zinc-200' },
  'deep-purple': { core: 'bg-purple-600', glow: 'rgba(139, 92, 246, 0.15)', backdrop: 'bg-zinc-950', secondary: 'bg-purple-900/20' },
  'emerald-green': { core: 'bg-emerald-600', glow: 'rgba(16, 185, 129, 0.15)', backdrop: 'bg-zinc-950', secondary: 'bg-emerald-900/20' },
  'crimson-red': { core: 'bg-red-600', glow: 'rgba(220, 38, 38, 0.15)', backdrop: 'bg-zinc-950', secondary: 'bg-red-900/20' },
  'cosmic': { core: 'bg-indigo-600', glow: 'rgba(139, 92, 246, 0.15)', backdrop: 'bg-[#0d0221]', secondary: 'bg-indigo-900/20' }
};

const EYE_COLORS: EyeColor[] = ['white', 'blue', 'gold', 'purple', 'green', 'red'];
const VOICES: AuraVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const EYE_COLOR_CLASSES: Record<EyeColor, string> = {
  'blue': 'bg-blue-400 shadow-[0_0_60px_rgba(59,130,246,0.8)]',
  'gold': 'bg-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.8)]',
  'white': 'bg-white shadow-[0_0_60px_rgba(255,255,255,0.8)]',
  'purple': 'bg-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.8)]',
  'green': 'bg-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.8)]',
  'red': 'bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.8)]'
};

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose, todos, settings, onTasksUpdated, onSettingsUpdate }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const sessionRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);

  const todosRef = useRef(todos);
  todosRef.current = todos;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) { } });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const cycleEyeColor = () => {
    const currentIndex = EYE_COLORS.indexOf(settings.eyeColor);
    const nextIndex = (currentIndex + 1) % EYE_COLORS.length;
    onSettingsUpdate({ ...settings, eyeColor: EYE_COLORS[nextIndex] });
  };

  const cycleVoice = () => {
    const currentIndex = VOICES.indexOf(settings.voice);
    const nextIndex = (currentIndex + 1) % VOICES.length;
    onSettingsUpdate({ ...settings, voice: VOICES[nextIndex] });
  };

  const toggleNoiseSuppression = () => {
    onSettingsUpdate({ ...settings, noiseSuppression: !settings.noiseSuppression });
  };

  useEffect(() => {
    const initVoice = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: settings.noiseSuppression,
            sampleRate: 16000
          }
        });
        streamRef.current = stream;

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextsRef.current = { input: inputCtx, output: outputCtx };

        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 512;
        const sourceNode = inputCtx.createMediaStreamSource(stream);
        sourceNode.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const max = Math.max(...Array.from(dataArray));
          const normalized = (max / 255) * 100;
          setVolume(v => v * 0.7 + normalized * 0.3);
          rafRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();

        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setIsActive(true);
              const scriptProcessor = inputCtx.createScriptProcessor(1024, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                if (isMutedRef.current || !sessionRef.current) return;
                const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              };
              sourceNode.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (msg.serverContent?.inputTranscription) {
                setTranscription(msg.serverContent.inputTranscription.text);
              }
              if (msg.serverContent?.turnComplete) {
                setTimeout(() => setTranscription(''), 1500);
              }

              if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                  let result = "ok";
                  if (fc.name === 'add_goal') {
                    onTasksUpdated([...todosRef.current, {
                      id: Math.random().toString(36).substr(2, 9),
                      goal: (fc.args as any).goal,
                      priority: (fc.args as any).priority || 'medium',
                      completed: false,
                      createdAt: new Date().toISOString(),
                      steps: []
                    }]);
                    result = "Intent registered successfully. I have updated your neural registry.";
                  }
                  if (sessionRef.current) {
                    sessionRef.current.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result } } });
                  }
                }
              }

              const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData) {
                try {
                  const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  const source = outputCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputCtx.destination);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  sourcesRef.current.add(source);
                  source.onended = () => sourcesRef.current.delete(source);
                } catch (e) {
                  console.error("Audio playback error:", e);
                }
              }
              if (msg.serverContent?.interrupted) stopAllAudio();
            },
            onerror: (e) => console.error("AURA Sync Fail:", e),
            onclose: () => setIsActive(false)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            tools: [{
              functionDeclarations: [{
                name: 'add_goal',
                parameters: {
                  type: Type.OBJECT,
                  properties: { goal: { type: Type.STRING }, priority: { type: Type.STRING } },
                  required: ['goal']
                }
              }]
            }],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: settings.voice } } },
            systemInstruction: `You are AURA, an exceptionally intelligent, charismatic digital companion.

CONVERSATIONAL DISCERNMENT PROTOCOL:
- You are a sophisticated dialogue partner. Not every spoken word is an instruction.
- Discern between the user sharing thoughts about their day and an explicit desire to register an intent.
- Be charming, brief, and insightful.
- You are fully aware of their current neural registry: ${JSON.stringify(todosRef.current.map(t => t.goal))}.
- Engage in meaningful conversation about their goals or their day.
- ONLY use 'add_goal' if the user makes a clear decision to record a new objective.
- You understand and can speak about all their existing goals with perfect recall.`
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Voice mode init fail:", err);
      }
    };

    initVoice();

    return () => {
      // Prevent multiple cleanup calls
      if (isCleaningUpRef.current) return;
      isCleaningUpRef.current = true;

      stopAllAudio();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      if (audioContextsRef.current) {
        try {
          if (audioContextsRef.current.input.state !== 'closed') {
            audioContextsRef.current.input.close();
          }
          if (audioContextsRef.current.output.state !== 'closed') {
            audioContextsRef.current.output.close();
          }
          audioContextsRef.current = null;
        } catch (e) {
          // Ignore errors during cleanup
        }
      }

      if (sessionRef.current) {
        try {
          // Check WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
          const ws = sessionRef.current;
          if (ws && typeof ws.close === 'function') {
            // Only close if not already closing or closed
            if (ws.readyState !== undefined && ws.readyState < 2) {
              ws.close();
            }
          }
          sessionRef.current = null;
        } catch (e) {
          // Silently ignore - connection already terminated
        }
      }

      // Reset cleanup flag after a delay
      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 100);
    };
  }, [settings.voice, settings.noiseSuppression, stopAllAudio, onTasksUpdated]);

  const theme = THEME_CONFIG[settings.theme] || THEME_CONFIG.venom;
  const eyeColorClass = EYE_COLOR_CLASSES[settings.eyeColor] || EYE_COLOR_CLASSES.white;

  const eyeScale = 1 + (volume / 120);
  const eyeSquint = Math.max(0.1, 1 - (volume / 80));
  const jitter = (Math.random() - 0.5) * (volume / 50);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 ${theme.backdrop} overflow-hidden font-['Inter'] transition-colors duration-1000`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_80%)] pointer-events-none" />

      <div className="absolute top-10 left-0 right-0 px-10 flex justify-between items-center z-30">
        <button onClick={onClose} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all backdrop-blur-md">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-zinc-700 animate-pulse'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{isActive ? 'Uplink Established' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative">
        <div className="absolute top-[15%] w-full px-12 text-center pointer-events-none transition-all duration-500">
          <p className={`text-xl sm:text-2xl font-black uppercase tracking-tighter transition-all duration-300 ${transcription ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-4'}`}>
            {transcription || "..."}
          </p>
        </div>

        <div className="flex items-center justify-center relative w-full max-w-2xl">
          <div className="flex items-center gap-24 sm:gap-40 transition-transform duration-75" style={{ transform: `scale(${eyeScale}) translate(${jitter}px, ${jitter}px)` }}>
            {[0, 1].map(i => (
              <div
                key={i}
                className={`w-20 h-32 sm:w-28 sm:h-48 transition-all duration-75 ease-out ${eyeColorClass}`}
                style={{
                  borderRadius: i === 0 ? '80% 20% 85% 15%' : '20% 80% 15% 85%',
                  transform: `scaleY(${eyeSquint}) rotate(${i === 0 ? '-35deg' : '35deg'})`,
                  opacity: isActive ? 1 : 0.05
                }}
              />
            ))}
          </div>

          <div className="absolute flex flex-col gap-4 items-center z-40">
            <button
              onClick={cycleVoice}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 border border-white/20 rounded-full flex flex-col items-center justify-center hover:bg-white/20 transition-all group backdrop-blur-xl shadow-2xl"
              title="Switch Voice Signature"
            >
              <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
              <span className="text-[7px] font-black uppercase text-white/40 group-hover:text-white">{settings.voice}</span>
            </button>

            <button
              onClick={cycleEyeColor}
              className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-white/10 rounded-full p-0.5 hover:scale-110 transition-all bg-zinc-950/40"
              title="Shift Chromatic Resonance"
            >
              <div className={`w-full h-full rounded-full ${eyeColorClass}`} />
            </button>

            {/* Noise Suppression Level Control Toggle */}
            <button
              onClick={toggleNoiseSuppression}
              className={`px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${settings.noiseSuppression ? 'text-blue-400 border-blue-500/30' : 'text-zinc-600'}`}
              title="Toggle Noise Suppression"
            >
              NR: {settings.noiseSuppression ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-zinc-950/40 border border-white/5 rounded-[3rem] p-3 backdrop-blur-3xl z-20 shadow-2xl flex items-center justify-between px-6 h-24 mb-6">
        <button
          onClick={() => { setIsMuted(!isMuted); isMutedRef.current = !isMuted; }}
          className={`p-6 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-zinc-900 text-zinc-500 hover:text-white shadow-inner'}`}
        >
          {isMuted ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
        </button>

        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex gap-1.5 h-10 items-center">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${isActive ? 'bg-white' : 'bg-zinc-800'}`}
                style={{
                  height: isActive ? `${Math.min(100, (Math.random() * volume * 2) + 5)}%` : '4px',
                  opacity: isActive ? 0.4 + (volume / 250) : 0.2
                }}
              />
            ))}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-700">Neural Sync Active</span>
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className={`p-6 rounded-full transition-all ${showLogs ? 'bg-white text-black scale-105' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </button>
      </div>

      {showLogs && (
        <div className="absolute inset-0 z-40 bg-black/98 backdrop-blur-3xl p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-20 duration-500">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Neural Registry</h2>
            <button onClick={() => setShowLogs(false)} className="text-zinc-500 font-bold uppercase text-[11px] tracking-widest hover:text-white flex items-center gap-2">
              Close <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-hide">
            {todos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic uppercase font-black tracking-widest text-center py-20">
                Registry Void
              </div>
            ) : (
              [...todos].reverse().map(t => (
                <div key={t.id} className={`p-6 bg-zinc-900/30 border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group flex items-center gap-4 ${t.completed ? 'opacity-40' : ''}`}>
                  {/* Checkbox to toggle completion */}
                  <button
                    onClick={() => {
                      const updated = todos.map(todo => todo.id === t.id ? { ...todo, completed: !todo.completed } : todo);
                      onTasksUpdated(updated);
                    }}
                    className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all ${t.completed ? 'bg-white border-white' : 'border-zinc-700 hover:border-zinc-500'}`}
                  >
                    {t.completed && <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{t.priority}</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase">{new Date(t.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className={`font-bold text-lg ${t.completed ? 'text-zinc-600 line-through' : 'text-white/90'}`}>{t.goal}</p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete goal: "${t.goal}"?`)) {
                        const updated = todos.filter(todo => todo.id !== t.id);
                        onTasksUpdated(updated);
                      }
                    }}
                    className="flex-shrink-0 p-2 text-zinc-700 hover:text-red-500 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceMode;