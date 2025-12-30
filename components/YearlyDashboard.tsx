import React, { useState } from 'react';
import { Todo, UserProfile } from '../types';
import { smartScheduleGoal } from '../services/geminiService';

interface YearlyDashboardProps {
    goals: Todo[];
    dailyTodos: Todo[];
    onClose: () => void;
    onAddDailyTask: (task: Todo) => void;
    user: UserProfile | null;
}

const YearlyDashboard: React.FC<YearlyDashboardProps> = ({ goals, dailyTodos, onClose, onAddDailyTask, user }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const overallProgress = goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
        : 0;

    const handleSmartSchedule = async (goal: Todo) => {
        if (processingId) return;
        setProcessingId(goal.id);
        try {
            const newTask = await smartScheduleGoal(goal, dailyTodos, user || undefined);
            if (newTask) {
                onAddDailyTask(newTask);
                alert(`Scheduled: "${newTask.goal}" for today!`);
            } else {
                alert("Could not schedule task. Try again.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-amber-500">2026 Dashboard</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Long-term Neural Registry</p>
                </div>
                <button onClick={onClose} className="p-3 rounded-full hover:bg-zinc-900 transition-all">
                    <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                            <div className="mb-6">
                                <div className="flex justify-between text-[10px] uppercase font-black text-zinc-500 mb-2">
                                    <span>Progress</span>
                                    <span>{goal.progress || 0}%</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500/80" style={{ width: `${goal.progress || 0}%` }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSmartSchedule(goal)}
                                    disabled={!!processingId}
                                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                >
                                    {processingId === goal.id ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>⚡ Smart Schedule</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YearlyDashboard;
