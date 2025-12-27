import React, { useState, useEffect, useRef } from 'react';
import { Todo, ChatMessage, AppMode, AuraSettings, AppState, UserProfile, NeuralPattern, ChatSessionMode, VoiceNote } from './types';
import { extractTasks, chatWithAura, extractTasksFromAudio } from './services/geminiService';
import { scheduleTaskReminders, requestNotificationPermission } from './services/notificationService';
import { saveVoiceNote, getAllVoiceNotes, deleteVoiceNote as dbDeleteVoiceNote } from './services/db';
import { syncTodosToCloud, syncTodosFromCloud, syncSettingsToCloud, syncSettingsFromCloud, debouncedSync } from './services/syncService';
import { supabase } from './services/supabaseClient';
import VoiceMode from './components/VoiceMode.tsx';
import ScannerMode from './components/ScannerMode.tsx';
import CalendarView from './components/CalendarView.tsx';
import EditTaskModal from './components/EditTaskModal.tsx';
import LandingPage from './components/LandingPage.tsx';
import Auth from './components/Auth.tsx';
import Onboarding from './components/Onboarding.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.tsx';
import OfflineIndicator from './components/OfflineIndicator.tsx';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.Notes);
  const [chatMode, setChatMode] = useState<ChatSessionMode>(ChatSessionMode.Insight);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<Record<string, VoiceNote>>({});
  const [patterns, setPatterns] = useState<NeuralPattern>({
    frequentLabels: [],
    preferredLanguage: 'English',
    lastActionType: 'Inception',
    averageTaskComplexity: 1
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [voiceHistory, setVoiceHistory] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [manualGoalInput, setManualGoalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatRecording, setIsChatRecording] = useState(false);
  const [syncNotification, setSyncNotification] = useState<{ msg: string, type: 'sync' | 'reminder' | 'learning' } | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const [settings, setSettings] = useState<AuraSettings>({
    language: 'en',
    languageLabel: 'English',
    voice: 'Kore',
    theme: 'venom',
    eyeColor: 'white',
    reminderMinutes: 10,
    learningEnabled: true,
    noiseSuppression: true
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptionRef = useRef<string>("");

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, mode]); // Added mode to trigger on open

  // Persist Todos to LocalStorage
  useEffect(() => {
    localStorage.setItem('aura_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const loadData = async () => {
      // Guest Mode: Skip authentication if enabled
      const guestMode = import.meta.env.VITE_GUEST_MODE === 'true';

      const savedUser = localStorage.getItem('aura_user');
      const savedTodos = localStorage.getItem('aura_todos');
      const savedSettings = localStorage.getItem('aura_settings');
      const savedChatHistory = localStorage.getItem('aura_chat_history');
      const savedVoiceHistory = localStorage.getItem('aura_voice_history');

      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setAppState(u.onboarded ? AppState.Main : AppState.Onboarding);
      } else if (guestMode) {
        // Auto-create guest user
        const guestUser: UserProfile = {
          name: 'Guest User',
          email: 'guest@aura.local',
          focusArea: 'Testing & Exploration',
          onboarded: true
        };
        setUser(guestUser);
        setAppState(AppState.Main);
        localStorage.setItem('aura_user', JSON.stringify(guestUser));
      }

      if (savedTodos) {
        const raw = JSON.parse(savedTodos);
        setTodos(raw.map((t: any) => ({ ...t, goal: t.goal || t.task })));
      }
      if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));

      // Load chat histories
      if (savedChatHistory) {
        try {
          setChatHistory(JSON.parse(savedChatHistory));
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
      if (savedVoiceHistory) {
        try {
          setVoiceHistory(JSON.parse(savedVoiceHistory));
        } catch (e) {
          console.error('Failed to load voice history:', e);
        }
      }

      // Try to load from cloud (if user is authenticated)
      if (savedUser && !guestMode) {
        const cloudTodos = await syncTodosFromCloud();
        if (cloudTodos) {
          setTodos(cloudTodos);
          localStorage.setItem('aura_todos', JSON.stringify(cloudTodos));
        }

        const u = JSON.parse(savedUser);
        const cloudSettings = await syncSettingsFromCloud(u.id);
        if (cloudSettings) {
          setSettings(cloudSettings);
          localStorage.setItem('aura_settings', JSON.stringify(cloudSettings));
        }
      }

      try {
        const notes = await getAllVoiceNotes();
        const noteMap = notes.reduce((acc, n) => ({ ...acc, [n.id]: n }), {});
        setVoiceNotes(noteMap);
      } catch (e) {
        console.error("Signal storage recovery fail:", e);
      }

      requestNotificationPermission();
    };
    loadData();
  }, []);

  // Auto-save to localStorage and cloud sync
  useEffect(() => {
    localStorage.setItem('aura_todos', JSON.stringify(todos));
    localStorage.setItem('aura_settings', JSON.stringify(settings));
    localStorage.setItem('aura_chat_history', JSON.stringify(chatHistory));
    localStorage.setItem('aura_voice_history', JSON.stringify(voiceHistory));
    if (user) localStorage.setItem('aura_user', JSON.stringify(user));

    // Cloud sync (debounced to avoid excessive API calls)
    if (user && user.email !== 'guest@aura.local') {
      debouncedSync(async () => {
        await syncTodosToCloud(todos);
        await syncSettingsToCloud(user.id || user.email, settings);
      });
    }
  }, [todos, settings, user, chatHistory, voiceHistory]);

  const showSyncMessage = (msg: string, type: 'sync' | 'reminder' | 'learning' = 'sync') => {
    setSyncNotification({ msg, type });
    setTimeout(() => setSyncNotification(null), 3000);
  };

  const playVoiceNote = (noteId: string) => {
    const note = voiceNotes[noteId];
    if (!note) return;
    if (currentlyPlaying === noteId) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentlyPlaying(null);
      return;
    }
    try {
      if (!note.audioBase64) return;
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(`data:${note.mimeType || 'audio/webm'};base64,${note.audioBase64}`);
      audioRef.current = audio;
      audio.play().catch(e => setCurrentlyPlaying(null));
      setCurrentlyPlaying(noteId);
      audio.onended = () => setCurrentlyPlaying(null);
    } catch (e) {
      setCurrentlyPlaying(null);
    }
  };

  const removeVoiceNote = async (id: string) => {
    await dbDeleteVoiceNote(id);
    setVoiceNotes(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const addGoalManually = () => {
    const trimmedInput = manualGoalInput.trim();
    if (!trimmedInput) return;
    const newGoal: Todo = {
      id: Math.random().toString(36).substr(2, 9),
      goal: trimmedInput,
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      steps: []
    };
    setTodos(prev => [newGoal, ...prev]);
    setManualGoalInput('');
    showSyncMessage("Goal Registered");
  };

  const toggleRecording = async (isForChat = false) => {
    const currentRecordingState = isForChat ? isChatRecording : isRecording;
    const setRecordingState = isForChat ? setIsChatRecording : setIsRecording;

    if (currentRecordingState) {
      // STOP RECORDING
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      if (recognitionRef.current) recognitionRef.current.stop();
      setRecordingState(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordDuration(0);
      return;
    }

    // START RECORDING
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. Start MediaRecorder (for audio file)
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      // 2. Start SpeechRecognition (for transcription)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognitionRef.current = recognition;
        transcriptionRef.current = "";

        recognition.onresult = (event: any) => {
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
          }
          if (final) transcriptionRef.current += " " + final;
        };
        recognition.start();
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const noteId = Math.random().toString(36).substr(2, 9);

          try {
            let tasks: Todo[] = [];
            let transcription = transcriptionRef.current.trim();

            // If browser transcription worked, use it!
            if (transcription) {
              console.log("Using Browser Transcription:", transcription);
              if (isForChat) {
                handleSendMessage(transcription);
              } else {
                // Use text-only extraction (Reliable)
                tasks = await extractTasks(transcription, todos, patterns, user || undefined);
              }
            } else {
              // Fallback to API Audio Extraction (Unreliable currently)
              console.log("Browser transcription empty, using API...");
              const result = await extractTasksFromAudio(base64, 'audio/webm', todos, patterns, user || undefined);
              tasks = result.tasks;
              transcription = result.transcription;
              if (isForChat && transcription) handleSendMessage(transcription);
            }

            const vNote: VoiceNote = { id: noteId, audioBase64: base64, transcription: transcription || "Audio Note", timestamp: new Date().toISOString(), mimeType: 'audio/webm' };
            await saveVoiceNote(vNote);
            setVoiceNotes(prev => ({ ...prev, [noteId]: vNote }));

            if (tasks.length > 0) {
              const updatedTasks = tasks.map(t => {
                const isNew = !todos.find(old => old.id === t.id);
                return isNew ? { ...t, voiceNoteId: noteId } : t;
              });
              setTodos(updatedTasks);
            }

            if (!isForChat) showSyncMessage("Neural Signal Cached");
          } catch (e) {
            console.error("Extraction failed:", e);
          } finally {
            setIsProcessing(false);
            transcriptionRef.current = ""; // Reset
          }
        };
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setRecordingState(true);
      timerRef.current = window.setInterval(() => setRecordDuration(p => p + 1), 1000);

    } catch (e) {
      alert("Microphone required.");
      console.error(e);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msg = text || inputValue;
    if (!msg.trim() || isProcessing) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    try {
      const responseText = await chatWithAura(msg, chatHistory, todos, patterns, user || undefined, chatMode);
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'model', content: responseText, timestamp: new Date().toISOString() }]);
      if (chatMode === ChatSessionMode.Override) {
        const updated = await extractTasks(msg, todos, patterns, user || undefined);
        setTodos(updated);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Signal lost. Re-establishing...", timestamp: new Date().toISOString() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getThemeClass = (l: string, d: string) => settings.theme === 'pure-white' ? l : d;

  if (appState === AppState.Landing) return <LandingPage onStart={() => setAppState(AppState.Auth)} />;
  if (appState === AppState.Auth) return <Auth
    onComplete={(email) => {
      setUser({ name: '', email, focusArea: '', onboarded: false });
      setAppState(AppState.Onboarding);
    }}
    onBack={() => setAppState(AppState.Landing)}
    onGuestMode={() => {
      const guestUser: UserProfile = {
        name: 'Guest User',
        email: 'guest@aura.local',
        focusArea: 'Testing & Exploration',
        onboarded: true
      };
      setUser(guestUser);
      setAppState(AppState.Main);
      localStorage.setItem('aura_user', JSON.stringify(guestUser));
    }}
  />;
  if (appState === AppState.Onboarding) return <Onboarding onComplete={(p, s) => { setUser(prev => ({ ...prev!, ...p, onboarded: true })); setSettings(prev => ({ ...prev, ...s })); setAppState(AppState.Main); }} />;

  return (
    <div className={`min-h-screen ${getThemeClass('bg-zinc-50 text-zinc-900', 'bg-black text-zinc-100')} flex flex-col transition-all duration-500 font-['Inter']`}>
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 backdrop-blur-xl sticky top-0 z-50 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-black">A</div>
          <div><h1 className="text-xl font-bold tracking-tighter uppercase italic">AURA</h1></div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-zinc-900 transition-all group"
        >
          <svg className="w-5 h-5 text-zinc-500 group-hover:text-white transition-all group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Settings</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 pb-40 overflow-x-hidden">
        {syncNotification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              {syncNotification.msg}
            </div>
          </div>
        )}

        {mode === AppMode.Notes && (
          <div className="h-full flex flex-col items-center justify-center gap-8 py-4 sm:py-10">
            <div className="text-center space-y-4">
              <h2 className="text-7xl sm:text-9xl font-black uppercase tracking-tighter leading-[0.8]">Neural<br />Signal</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">Awaiting Signal Injection</p>
            </div>

            <button
              onClick={() => toggleRecording(false)}
              className={`w-48 h-48 sm:w-80 sm:h-80 rounded-full flex items-center justify-center transition-all duration-700 relative ${isRecording ? 'bg-red-500 scale-105 shadow-[0_0_80px_rgba(239,68,68,0.4)]' : 'bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 shadow-2xl'}`}
            >
              {isRecording && <div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-20" />}
              {isProcessing ? <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-16 h-16 sm:w-32 sm:h-32 transition-colors text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={0.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
            </button>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">{isRecording ? `SYNCING: ${recordDuration}s` : 'Initialize Signal Loop'}</p>

            <div className="w-full mt-12 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Signal Archive</h3>
                <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">{Object.keys(voiceNotes).length} Nodes</span>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {Object.keys(voiceNotes).length === 0 ? <div className="py-16 text-center opacity-20 italic text-xs uppercase font-black tracking-widest border border-dashed border-zinc-900 rounded-[3rem]">Void</div> :
                  (Object.values(voiceNotes) as VoiceNote[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(note => (
                    <div key={note.id} className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-[2.5rem] flex items-center gap-6 hover:bg-zinc-900/50 transition-all group shadow-2xl">
                      <button onClick={() => playVoiceNote(note.id)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${currentlyPlaying === note.id ? 'bg-white text-black animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                        {currentlyPlaying === note.id ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-200 italic line-clamp-2">"{note.transcription || 'Unresolved...'}"</p>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <button onClick={() => removeVoiceNote(note.id)} className="p-3 text-zinc-800 hover:text-red-900 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {mode === AppMode.List && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Goal<br />Registry</h2>
              <button onClick={() => setShowCompleted(!showCompleted)} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">{showCompleted ? 'Hide Archive' : 'Open Archive'}</button>
            </div>
            <div className="flex gap-4 p-2 bg-zinc-900/60 rounded-[2.5rem] border border-zinc-800 group focus-within:border-zinc-500 transition-all shadow-2xl">
              <input type="text" value={manualGoalInput} onChange={(e) => setManualGoalInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addGoalManually()} placeholder="Manual Intent Injection..." className="flex-1 bg-transparent border-none outline-none px-6 py-3 text-sm font-bold text-white" />
              <button onClick={addGoalManually} className="p-3 bg-white text-black rounded-full hover:scale-105 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
            </div>
            <div className="space-y-4">
              {todos.filter(t => showCompleted ? true : !t.completed).map(t => (
                <div key={t.id} onClick={() => setEditingTodo(t)} className={`p-6 bg-zinc-900/40 border border-zinc-900 rounded-[2.5rem] flex items-center gap-5 cursor-pointer hover:border-zinc-700 transition-all ${t.completed ? 'opacity-40 grayscale' : ''}`}>
                  <div className="flex-1 min-w-0"><h3 className="font-black text-xl truncate text-white">{t.goal}</h3></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === AppMode.Chat && (
          <div className="flex flex-col h-[70vh] border border-zinc-900 rounded-[3rem] overflow-hidden bg-zinc-950/50 backdrop-blur-xl">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-6 rounded-[2rem] text-lg font-bold shadow-2xl ${msg.role === 'user' ? 'bg-white text-black rounded-br-none' : 'bg-zinc-900 text-zinc-300 rounded-bl-none border border-zinc-800'}`}>{msg.content}</div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-zinc-900/50 p-6 rounded-[2rem] rounded-bl-none border border-zinc-800/50 text-zinc-500 text-xs">AURA thinking...</div>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 sm:p-8 border-t border-zinc-900 bg-black/40 flex items-center gap-4">
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isChatRecording ? "LISTENING..." : "Establish dialogue..."}
                  className={`w-full bg-zinc-900/60 border-none rounded-full pl-8 pr-16 py-6 text-base outline-none text-white focus:ring-1 focus:ring-zinc-700 transition-all ${isChatRecording ? 'ring-2 ring-red-500/50 animate-pulse' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => toggleRecording(true)}
                  className={`absolute right-4 p-3 rounded-full transition-all ${isChatRecording ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              </div>
              <button type="submit" className="p-6 bg-white text-black rounded-full font-black hover:scale-105 active:scale-95 transition-all shadow-xl flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3.2} d="M5 13l4 4L19 7" /></svg>
              </button>
            </form>
          </div>
        )}

        {mode === AppMode.Scan && <ScannerMode settings={settings} currentTodos={todos} onTasksUpdated={setTodos} onClose={() => setMode(AppMode.Notes)} />}
        {mode === AppMode.Calendar && <CalendarView todos={todos} onTasksUpdated={setTodos} onEditTask={setEditingTodo} />}
      </main>

      <nav className="h-24 border-t border-zinc-900 bg-black/80 backdrop-blur-3xl fixed bottom-0 left-0 right-0 flex flex-col items-center justify-center gap-1 z-50">
        <div className="flex justify-around items-center w-full px-4">
          {[
            { m: AppMode.Notes, icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
            { m: AppMode.List, icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
            { m: AppMode.Scan, icon: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" },
            { m: AppMode.Chat, icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
            { m: AppMode.Calendar, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }
          ].map(({ m, icon }) => (
            <button key={m} onClick={() => setMode(m)} className={`p-4 rounded-[1.5rem] transition-all ${mode === m ? 'bg-white text-black scale-110 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d={icon} /></svg>
            </button>
          ))}
        </div>
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-700 opacity-50 pb-1">
          Powered by Ryanflow.ink
        </div>
      </nav>

      {editingTodo && <EditTaskModal todo={editingTodo} onClose={() => setEditingTodo(null)} onSave={(ut) => setTodos(p => p.map(t => t.id === ut.id ? ut : t))} onSyncCalendar={() => { }} />}

      <button onClick={() => setMode(AppMode.Voice)} className="fixed bottom-28 right-6 z-[60] w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-all">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
      </button>

      {mode === AppMode.Voice && <VoiceMode settings={settings} initialHistory={voiceHistory} onHistoryUpdate={setVoiceHistory} onClose={() => setMode(AppMode.Notes)} todos={todos} onTasksUpdated={setTodos} onCalendarSynced={() => { }} onSettingsUpdate={setSettings} />}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsUpdate={setSettings}
          user={user}
          onSignOut={() => {
            // Clear all data
            localStorage.removeItem('aura_user');
            localStorage.removeItem('aura_todos');
            localStorage.removeItem('aura_settings');
            localStorage.removeItem('aura_chat_history');
            localStorage.removeItem('aura_voice_history');

            // Reset state
            setUser(null);
            setTodos([]);
            setChatHistory([]);
            setVoiceHistory([]);
            setAppState(AppState.Auth);
          }}
        />
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;
