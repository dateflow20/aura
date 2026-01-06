import React, { useState } from 'react';
import { Todo, UserProfile } from '../types';
import { smartScheduleGoal } from '../services/geminiService';

interface YearlyDashboardProps {
    goals: Todo[];
    dailyTodos: Todo[];
    onClose: () => void;
    onAddDailyTask: (task: Todo) => void;
    onAddGoal: () => void;
    onUpdateProgress: (goalId: string, update: string, image?: { base64: string, mimeType: string }) => void;
    user: UserProfile | null;
    autoScheduleEnabled: boolean;
    onToggleAutoSchedule: (enabled: boolean) => void;
}

const YearlyDashboard: React.FC<YearlyDashboardProps> = ({ goals, dailyTodos, onClose, onAddDailyTask, onAddGoal, onUpdateProgress, user, autoScheduleEnabled, onToggleAutoSchedule }) => {
    const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
    const [updateText, setUpdateText] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const overallProgress = goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
        : 0;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, goalId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            onUpdateProgress(goalId, "Image update", { base64, mimeType: file.type });
            setIsUploading(false);
            setUpdatingGoalId(null);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-amber-500">2026 Dashboard</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Long-term Neural Registry</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onAddGoal} className="p-3 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-2 px-4">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Add Goal</span>
                    </button>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-zinc-900 transition-all">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Auto-Architect Toggle */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Neural Auto-Architect</h3>
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">AI will autonomously inject yearly goals into your daily registry based on your cognitive patterns and priority.</p>
                    </div>
                    <button
                        onClick={() => onToggleAutoSchedule(!autoScheduleEnabled)}
                        className={`w-16 h-8 rounded-full transition-all relative ${autoScheduleEnabled ? 'bg-amber-500' : 'bg-zinc-800'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${autoScheduleEnabled ? 'left-9 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'left-1'}`} />
                    </button>
                </div>

                {/* Overview Card */}
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-zinc-400 text-xs font-black uppercase tracking-widest">Yearly Completion</span>
                            <span className="text-4xl font-black text-white">{overallProgress}%</span>
                        </div>
                        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
                        </div>
                    </div>
                </div>

                {/* Goals List */}
                <div className="space-y-6">
                    <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest px-2">Active Resolutions</h3>
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-amber-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-white text-lg leading-tight">{goal.goal}</h4>
                                    {goal.targetValue && (
                                        <p className="text-xs font-black text-amber-500/60 uppercase tracking-widest mt-1">
                                            {goal.unit || ''}{goal.currentValue || 0} / {goal.unit || ''}{goal.targetValue}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            const { smartScheduleGoal } = await import('../services/geminiService');
                                            const newTask = await smartScheduleGoal(goal, dailyTodos, user || undefined);
                                            if (newTask) onAddDailyTask(newTask);
                                        }}
                                        className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-amber-500 hover:text-black transition-all"
                                        title="Smart Schedule Next Step"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Progress for this goal */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] uppercase font-black text-zinc-500 mb-2">
                                    <span>Neural Progress</span>
                                    <span>{goal.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-amber-500/80 transition-all duration-700" style={{ width: `${goal.progress || 0}%` }} />
                                </div>

                                {updatingGoalId === goal.id ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={updateText}
                                                onChange={(e) => setUpdateText(e.target.value)}
                                                placeholder="What's the status?"
                                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onUpdateProgress(goal.id, updateText);
                                                        setUpdatingGoalId(null);
                                                        setUpdateText('');
                                                    }
                                                }}
                                            />
                                            <label className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer transition-all">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, goal.id)} />
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </label>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setUpdatingGoalId(null)} className="text-[10px] font-black uppercase text-zinc-600 hover:text-zinc-400">Cancel</button>
                                            <button
                                                onClick={() => {
                                                    onUpdateProgress(goal.id, updateText);
                                                    setUpdatingGoalId(null);
                                                    setUpdateText('');
                                                }}
                                                className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400"
                                            >
                                                Analyze Update
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setUpdatingGoalId(goal.id)}
                                        className="w-full py-2 rounded-xl border border-dashed border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-all"
                                    >
                                        Update Progress
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {isUploading && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Uploading Signal...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YearlyDashboard;
