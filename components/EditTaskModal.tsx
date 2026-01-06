
import React, { useState } from 'react';
import { Todo, TodoStep } from '../types';

interface EditTaskModalProps {
  todo: Todo;
  onSave: (updatedTodo: Todo) => void;
  onClose: () => void;
  onSyncCalendar: (todo: Todo) => void;
  onDelete?: (todoId: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ todo, onSave, onClose, onSyncCalendar, onDelete }) => {
  const [goal, setGoal] = useState(todo.goal);
  const [description, setDescription] = useState(todo.description || '');
  const [priority, setPriority] = useState(todo.priority);

  const formatForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [dueDate, setDueDate] = useState(formatForInput(todo.dueDate));
  const [steps, setSteps] = useState<TodoStep[]>(todo.steps || []);
  const [pinned, setPinned] = useState(todo.pinned || false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let finalDueDate: string | undefined = dueDate ? new Date(dueDate).toISOString() : undefined;

    onSave({
      ...todo,
      goal,
      description,
      priority,
      dueDate: finalDueDate,
      steps,
      pinned,
      progress: steps.length > 0 ? Math.round((steps.filter(s => s.completed).length / steps.length) * 100) : todo.progress
    });
  };

  const toggleStep = (stepId: string) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s));
  };

  const addStep = () => {
    const text = window.prompt("Inject Sub-Step Intent:");
    if (text && text.trim()) {
      setSteps([...steps, { id: Math.random().toString(36).substr(2, 9), text: text.trim(), completed: false }]);
      if (!isEditing) setIsEditing(true);
    }
  };

  const progress = steps.length > 0 ? (steps.filter(s => s.completed).length / steps.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className={`px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest ${priority === 'high' ? 'bg-red-500 text-white' : priority === 'medium' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                }`}>
                {priority} Priority
              </span>
            </div>
            {isEditing ? (
              <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} className="text-2xl font-bold bg-transparent border-none outline-none text-white w-full p-0" placeholder="Goal name" />
            ) : (
              <h2 className="text-2xl font-bold text-white">{goal}</h2>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-3 p-6 bg-zinc-950/20 border border-zinc-800 rounded-2xl">
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div className="h-full bg-white transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Context & Parameters</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isEditing} className="w-full bg-zinc-800/50 border border-zinc-800 rounded-2xl px-4 py-4 text-sm outline-none resize-none text-zinc-300 min-h-[120px]" placeholder="Contextual parameters..." />
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-4 p-4 bg-zinc-950/30 border border-zinc-800 rounded-2xl">
                <button onClick={() => toggleStep(step.id)} className={`w-6 h-6 rounded-lg border-2 ${step.completed ? 'bg-white border-white' : 'border-zinc-800'}`}>
                  {step.completed && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className={`flex-1 text-sm ${step.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{step.text}</span>
              </div>
            ))}
            <button onClick={addStep} className="w-full py-5 border-2 border-dashed border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:border-zinc-600 transition-all">Inject Sub-Intent</button>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950/40 flex gap-4">
          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-zinc-800 text-zinc-400">{isEditing ? 'Lock' : 'Edit'}</button>
          {onDelete && !todo.isLocked && (
            <button
              onClick={() => {
                if (window.confirm(`Delete goal: "${todo.goal}"?`)) {
                  onDelete(todo.id);
                  onClose();
                }
              }}
              className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-all"
            >
              Delete
            </button>
          )}
          {todo.isLocked && (
            <div className="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-zinc-800/50 text-zinc-500 flex items-center gap-2 cursor-not-allowed">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
              Locked
            </div>
          )}
          <button onClick={() => handleSave()} className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest">Commit Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
