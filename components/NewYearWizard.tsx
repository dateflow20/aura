import React, { useState, useRef } from 'react';
import { extractTasks, extractTasksFromAudio } from '../services/geminiService';
import { Todo, UserProfile, NeuralPattern } from '../types';

interface NewYearWizardProps {
    onClose: () => void;
    onCommit: (goals: Todo[]) => void;
    user: UserProfile | null;
    patterns?: NeuralPattern;
}

const NewYearWizard: React.FC<NewYearWizardProps> = ({ onClose, onCommit, user, patterns }) => {
    const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
    const [mode, setMode] = useState<'voice' | 'text'>('voice');
    const [textInput, setTextInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [generatedGoals, setGeneratedGoals] = useState<Todo[]>([]);

    // Audio Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    processAudio(base64);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
            alert("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setStep('processing');
        }
    };

    const processAudio = async (base64: string) => {
        try {
            const result = await extractTasksFromAudio(base64, 'audio/webm', [], patterns, user || undefined);
            // Force category to new-year
            const goals = result.tasks.map(t => ({ ...t, category: 'new-year' as const, isLocked: true, progress: 0 }));
            setGeneratedGoals(goals);
            setStep('review');
        } catch (e) {
            console.error(e);
            setStep('input');
            alert("Failed to process audio.");
        }
    };

    const processText = async () => {
        if (!textInput.trim()) return;
        setStep('processing');
        try {
            const goals = await extractTasks(textInput, [], patterns, user || undefined, 'new-year');
            setGeneratedGoals(goals);
            setStep('review');
        } catch (e) {
            console.error(e);
            setStep('input');
            alert("Failed to process text.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-zinc-900">
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
                            <button
                                onClick={() => setMode('voice')}
                                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'voice' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}
                            >
                                Voice Signal
                            </button>
                            <button
                                onClick={() => setMode('text')}
                                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}
                            >
                                Text Input
                            </button>
                        </div>

                        {mode === 'voice' ? (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-zinc-900 border-2 border-zinc-800 hover:border-amber-500/50'}`}
                            >
                                {isRecording ? (
                                    <div className="w-12 h-12 bg-white rounded-sm animate-pulse" />
                                ) : (
                                    <svg className="w-16 h-16 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                )}
                            </button>
                        ) : (
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

                        <p className="text-zinc-500 text-xs font-medium text-center max-w-xs">
                            {mode === 'voice' ? (isRecording ? "Listening to your intent..." : "Tap to speak your goals") : "Write down your aspirations"}
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
                                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex gap-4">
                                    <div className="mt-1 w-6 h-6 rounded-full border-2 border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-500">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{goal.goal}</h4>
                                        <div className="mt-3 space-y-2">
                                            {goal.steps?.map((step, j) => (
                                                <div key={j} className="flex items-center gap-2 text-zinc-400 text-sm">
                                                    <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                                                    {step.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-900 flex gap-4">
                            <button
                                onClick={() => setStep('input')}
                                className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                            >
                                Retry
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
