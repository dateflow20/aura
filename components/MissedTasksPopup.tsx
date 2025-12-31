import React from 'react';
import { Todo } from '../types';

interface MissedTasksPopupProps {
    missedTasks: Todo[];
    consistencyScore: number;
    onAcknowledge: () => void;
}

const MissedTasksPopup: React.FC<MissedTasksPopupProps> = ({ missedTasks, consistencyScore, onAcknowledge }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden">
                {/* Neural Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[40px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/5 blur-[40px] rounded-full" />

                <div className="relative z-10 space-y-8 text-center">
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 17c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Neural Drift Detected</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/60">Signal Integrity Compromised</p>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-[2rem] space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Consistency Level</span>
                            <span className="text-xl font-black text-red-500">{consistencyScore}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 transition-all duration-1000"
                                style={{ width: `${consistencyScore}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 leading-relaxed italic">
                            "Your neural consistency is decreasing. Each missed signal weakens the habit loop. Re-establish focus to stabilize the system."
                        </p>
                    </div>

                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-left px-2">Unresolved Signals</h3>
                        {missedTasks.map(task => (
                            <div key={task.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4 text-left">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                <span className="text-sm font-bold text-zinc-300 truncate">{task.goal}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onAcknowledge}
                        className="w-full py-4 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Re-Establish Signal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MissedTasksPopup;
