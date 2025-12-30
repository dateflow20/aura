import React, { useState, useRef, useEffect, useCallback } from 'react';
import { extractTasks, extractTasksFromAudio, extractTasksFromImage } from '../services/geminiService';
import { Todo, UserProfile, NeuralPattern } from '../types';

interface NewYearWizardProps {
    onClose: () => void;
    onCommit: (goals: Todo[]) => void;
    user: UserProfile | null;
    patterns?: NeuralPattern;
}

const NewYearWizard: React.FC<NewYearWizardProps> = ({ onClose, onCommit, user, patterns }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
    const [mode, setMode] = useState<'voice' | 'text' | 'scan'>('voice');
    const [textInput, setTextInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [generatedGoals, setGeneratedGoals] = useState<Todo[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [visionSubMode, setVisionSubMode] = useState<'upload' | 'camera'>('upload');
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Live Voice State
    const [liveTranscript, setLiveTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const lastProcessedIndex = useRef(0);

    // Audio Refs (for legacy fallback if needed)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Camera Logic
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera denied:", err);
            alert("Camera access denied.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setCameraActive(false);
        }
    }, []);

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        stopCamera();
        processImage(base64, 'image/jpeg');
    };

    const processImage = async (base64: string, mimeType: string) => {
        setStep('processing');
        try {
            const tasks = await extractTasksFromImage(base64, mimeType, []);
            const goals = tasks.map(t => ({
                ...t,
                id: Math.random().toString(36).substring(2, 11),
                category: 'new-year' as const,
                isLocked: true,
                progress: 0,
                createdAt: new Date().toISOString()
            }));
            setGeneratedGoals(goals);
            setStep('review');
        } catch (err) {
            console.error(err);
            setStep('input');
            alert("Failed to analyze image.");
        }
    };

    // Live Voice Logic
    const startLiveVoice = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        // @ts-ignore
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setLiveTranscript(prev => {
                    const newText = prev + finalTranscript;
                    processLiveText(newText);
                    return newText;
                });
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
    };

    const stopLiveVoice = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const processLiveText = async (fullText: string) => {
        const newText = fullText.slice(lastProcessedIndex.current);
        if (newText.length < 15) return;

        lastProcessedIndex.current = fullText.length;

        try {
            const newGoals = await extractTasks(newText, [], patterns || { frequentLabels: [], preferredLanguage: 'English', lastActionType: 'Inception', averageTaskComplexity: 1 }, user || undefined, 'new-year');
            if (newGoals.length > 0) {
                setGeneratedGoals(prev => [
                    ...prev,
                    ...newGoals.map(g => ({
                        ...g,
                        id: Math.random().toString(36).substring(2, 11),
                        isLocked: true,
                        progress: 0,
                        createdAt: new Date().toISOString()
                    }))
                ]);
            }
        } catch (e) {
            console.error("Live processing error:", e);
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
            stopLiveVoice();
        };
    }, [stopCamera]);

    const processText = async () => {
        if (!textInput.trim()) return;
        setStep('processing');
        try {
            const goals = await extractTasks(textInput, [], patterns || { frequentLabels: [], preferredLanguage: 'English', lastActionType: 'Inception', averageTaskComplexity: 1 }, user || undefined, 'new-year');
            setGeneratedGoals(goals.map(g => ({
                ...g,
                id: Math.random().toString(36).substring(2, 11),
                isLocked: true,
                progress: 0,
                createdAt: new Date().toISOString()
            })));
            setStep('review');
        } catch (e) {
            console.error(e);
            setStep('input');
            alert("Failed to process text.");
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStep('processing');
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            processImage(base64, file.type);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-black/50 backdrop-blur-xl">
                <h2 className="text-xl font-black uppercase tracking-tighter text-amber-500">2026 Vision Architect</h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black pointer-events-none" />

                {step === 'input' && (
                    <div className="w-full max-w-lg z-10 flex flex-col items-center gap-8">
                        <div className="flex gap-4 mb-8">
                            {['voice', 'text', 'scan'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        setMode(m as any);
                                        if (m !== 'scan') stopCamera();
                                    }}
                                    className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {mode === 'voice' && (
                            <div className="flex flex-col items-center gap-6 w-full">
                                <button
                                    onClick={isRecording ? stopLiveVoice : startLiveVoice}
                                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/50'}`}
                                >
                                    {isRecording ? (
                                        <div className="w-12 h-12 bg-white rounded-sm animate-pulse" />
                                    ) : (
                                        <svg className="w-16 h-16 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    )}
                                </button>

                                {generatedGoals.length > 0 && (
                                    <div className="w-full max-w-md space-y-2 animate-in slide-in-from-bottom-4">
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-center mb-2">Detected Goals (Live)</p>
                                        <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {generatedGoals.map((goal) => (
                                                <div key={goal.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                        <span className="text-sm text-white font-medium">{goal.goal}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setGeneratedGoals(prev => prev.filter(g => g.id !== goal.id))}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setStep('review')}
                                            className="w-full py-3 bg-amber-500 text-black rounded-xl font-black uppercase tracking-widest hover:bg-amber-400 transition-colors mt-4"
                                        >
                                            Review & Commit ({generatedGoals.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'text' && (
                            <div className="w-full">
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Describe your vision for 2026..."
                                    className="w-full h-40 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                                />
                                <button
                                    onClick={processText}
                                    disabled={!textInput.trim()}
                                    className="w-full mt-4 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-colors disabled:opacity-50"
                                >
                                    Analyze
                                </button>
                            </div>
                        )}

                        {mode === 'scan' && (
                            <div className="w-full flex flex-col items-center gap-6">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => { setVisionSubMode('upload'); stopCamera(); }}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${visionSubMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                                    >
                                        Upload
                                    </button>
                                    <button
                                        onClick={() => { setVisionSubMode('camera'); startCamera(); }}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${visionSubMode === 'camera' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
                                    >
                                        Camera
                                    </button>
                                </div>

                                {visionSubMode === 'upload' ? (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-40 h-40 rounded-[2rem] bg-zinc-900 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-4 hover:border-amber-500/50 hover:bg-zinc-900/50 transition-all group"
                                        >
                                            <svg className="w-12 h-12 text-zinc-600 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">Upload Board</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl group">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Neural Overlays */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Corner Brackets */}
                                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-500/50" />
                                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-500/50" />
                                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-500/50" />
                                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-500/50" />

                                            {/* Scanning Line */}
                                            <div className="absolute inset-x-6 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-scan-line" />

                                            {/* Tech Text */}
                                            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500/80">Neural Vision Active</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={captureImage}
                                            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-zinc-300 shadow-2xl active:scale-90 transition-all flex items-center justify-center z-20"
                                        >
                                            <div className="w-12 h-12 rounded-full border-2 border-zinc-200" />
                                        </button>
                                    </div>
                                )}

                                <p className="text-zinc-500 text-xs font-medium text-center max-w-xs">
                                    {visionSubMode === 'upload' ? "Upload your Vision Board or Bingo Card." : "Point camera at your board to scan."}
                                </p>
                            </div>
                        )}

                        <p className="text-zinc-500 text-xs font-medium text-center max-w-xs">
                            {mode === 'voice' && (isRecording ? "Listening to your intent..." : "Tap to speak your goals")}
                            {mode === 'text' && "Write down your aspirations"}
                        </p>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center gap-6 z-10">
                        <div className="w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Architecting 2026...</p>
                    </div>
                )}

                {step === 'review' && (
                    <div className="w-full max-w-2xl z-10 h-full flex flex-col">
                        <h3 className="text-center text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">Generated Registry</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                            {generatedGoals.map((goal, i) => (
                                <div key={goal.id || i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex gap-4 group relative">
                                    <div className="mt-1 w-6 h-6 rounded-full border-2 border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-500">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-lg">{goal.goal}</h4>
                                        <div className="mt-3 space-y-2">
                                            {goal.steps?.map((s, j) => (
                                                <div key={j} className="flex items-center gap-2 text-zinc-400 text-sm">
                                                    <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                                                    {s.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setGeneratedGoals(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-4 right-4 p-2 hover:bg-red-500/20 rounded-lg text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-900 flex gap-4">
                            <button
                                onClick={() => setStep('input')}
                                className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                            >
                                Add More
                            </button>
                            <button
                                onClick={() => onCommit(generatedGoals)}
                                className="flex-[2] py-4 bg-amber-500 text-black rounded-xl font-black uppercase tracking-widest hover:bg-amber-400 transition-colors"
                            >
                                Commit to 2026
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewYearWizard;
