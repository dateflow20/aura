import React, { useState } from 'react';
import { Todo, UserProfile } from '../types';
import { smartScheduleGoal } from '../services/geminiService';

interface YearlyDashboardProps {
    goals: Todo[];
    dailyTodos: Todo[];
    onClose: () => void;
    onAddDailyTask: (task: Todo) => void;
    onAddGoal: () => void;
    user: UserProfile | null;
    autoScheduleEnabled: boolean;
    onToggleAutoSchedule: (enabled: boolean) => void;
}

const YearlyDashboard: React.FC<YearlyDashboardProps> = ({ goals, dailyTodos, onClose, onAddDailyTask, onAddGoal, user, autoScheduleEnabled, onToggleAutoSchedule }) => {
    const overallProgress = goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
        : 0;

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
                <div className="space-y-4">
                    <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest px-2">Active Resolutions</h3>
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2rem] hover:border-amber-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-white text-lg leading-tight max-w-[80%]">{goal.goal}</h4>
                                <div className="flex items-center gap-2">
                                    {goal.isLocked && <span className="text-xs text-zinc-600">🔒 Locked</span>}
                                </div>
                            </div>

                            {/* Progress for this goal */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] uppercase font-black text-zinc-500 mb-2">
                                    <span>Progress</span>
                                    <span>{goal.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500/80" style={{ width: `${goal.progress || 0}%` }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YearlyDashboard;
