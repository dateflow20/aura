
import React, { useState, useMemo } from 'react';
import { Todo } from '../types';

interface CalendarViewProps {
  todos: Todo[];
  onTasksUpdated: (tasks: Todo[]) => void;
  onEditTask: (todo: Todo) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ todos, onTasksUpdated, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthPadding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Group tasks by date for the grid
  const tasksByDay = useMemo(() => {
    const map: Record<number, Todo[]> = {};
    todos.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return; // Skip invalid dates
      if (d.getFullYear() === year && d.getMonth() === month) {
        const date = d.getDate();
        if (!map[date]) map[date] = [];
        map[date].push(t);
      }
    });
    return map;
  }, [todos, year, month]);

  // Tasks without dates (The Backlog)
  const unscheduledTasks = useMemo(() => {
    return todos.filter(t => {
      if (t.completed) return false;
      if (!t.dueDate) return true;
      const d = new Date(t.dueDate);
      return isNaN(d.getTime()); // If date is invalid, consider it unscheduled
    });
  }, [todos]);

  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const targetDate = new Date(year, month, day, 9, 0, 0); // Default to 9 AM

    const updatedTodos = todos.map(t =>
      t.id === taskId ? { ...t, dueDate: targetDate.toISOString() } : t
    );
    onTasksUpdated(updatedTodos);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const selectedTasks = selectedDay ? tasksByDay[selectedDay] || [] : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full animate-in fade-in zoom-in-95 duration-500">
      {/* Left Panel: Main Calendar Grid */}
      <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{monthName}</h2>
            <p className="text-zinc-600 text-[10px] font-black tracking-[0.4em] uppercase">{year} Epoch</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleToday} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-700 transition-all">Today</button>
            <div className="flex bg-zinc-950/50 rounded-xl border border-zinc-800 p-1">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[9px] uppercase font-black text-zinc-700 tracking-[0.2em] border-r border-zinc-800/30 last:border-r-0">{d}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-zinc-800 overflow-hidden">
          {prevMonthPadding.map(i => (
            <div key={`pad-${i}`} className="bg-zinc-900/40" />
          ))}
          {days.map(day => {
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const isSelected = selectedDay === day;
            const dayTasks = tasksByDay[day] || [];

            return (
              <div
                key={day}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => setSelectedDay(day)}
                className={`relative bg-zinc-900 p-2 transition-all cursor-pointer group min-h-[80px] sm:min-h-0 ${isSelected ? 'bg-blue-900/10' : 'hover:bg-zinc-800/40'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' :
                      isSelected ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'
                    }`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className={`w-1 h-1 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col gap-1 overflow-hidden">
                  {dayTasks.slice(0, 2).map(task => (
                    <div key={task.id} className={`text-[8px] px-1.5 py-0.5 rounded border truncate ${task.completed ? 'bg-zinc-950 border-zinc-800 text-zinc-700 line-through' :
                        task.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                      {/* Refactored: changed task.task to task.goal to match Todo interface */}
                      {task.goal}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[7px] text-zinc-700 font-black uppercase tracking-tighter ml-1">
                      +{dayTasks.length - 2} NODES
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Day Details & Backlog */}
      <div className="w-full lg:w-[320px] flex flex-col gap-6">
        {/* Selected Day Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Day Details</h3>
            <span className="text-xs font-black text-blue-500">{monthName} {selectedDay}</span>
          </div>
          <div className="flex-1 space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
            {selectedTasks.length === 0 ? (
              <div className="py-10 text-center opacity-20 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-dashed border-zinc-500" />
                <p className="text-[9px] font-black uppercase tracking-widest">No scheduled data</p>
              </div>
            ) : (
              selectedTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className={`p-3 rounded-2xl border bg-zinc-950/40 cursor-pointer hover:border-zinc-600 transition-all ${task.completed ? 'opacity-40 grayscale' : 'border-zinc-800'}`}
                >
                  {/* Refactored: changed task.task to task.goal to match Todo interface */}
                  <p className="text-xs font-bold truncate text-zinc-100">{task.goal}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{task.priority}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Neural Backlog (Drag from here) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col gap-4 shadow-xl flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Unscheduled Nodes</h3>
            <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">{unscheduledTasks.length}</span>
          </div>
          <p className="text-[9px] text-zinc-600 leading-relaxed uppercase tracking-tighter">Drag to the grid to synchronize temporal coordinates.</p>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-hide min-h-[200px]">
            {unscheduledTasks.length === 0 ? (
              <div className="py-12 text-center opacity-10 italic text-xs">Awaiting task injection...</div>
            ) : (
              unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500/40 transition-all group"
                >
                  {/* Refactored: changed task.task to task.goal to match Todo interface */}
                  <p className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{task.goal}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">{task.priority}</span>
                    <svg className="w-3 h-3 text-zinc-800 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
