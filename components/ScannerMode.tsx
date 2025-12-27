import React, { useRef, useEffect, useState, useCallback } from 'react';
import { extractTasksFromImage } from '../services/geminiService';
import { Todo, AuraSettings } from '../types';

interface ScannerModeProps {
  onClose: () => void;
  onTasksUpdated: (tasks: Todo[]) => void;
  currentTodos: Todo[];
  settings: AuraSettings;
}

const ScannerMode: React.FC<ScannerModeProps> = ({ onClose, onTasksUpdated, currentTodos, settings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedGoals, setExtractedGoals] = useState<Todo[]>([]);
  const [showResults, setShowResults] = useState(false);

  const cleanup = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied. Please allow camera permissions.");
      }
    };
    startCamera();
    return cleanup;
  }, [cleanup]);

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      setError("Canvas not available");
      setIsProcessing(false);
      return;
    }

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    try {
      const newGoals = await extractTasksFromImage(base64Image, 'image/jpeg', currentTodos);

      if (newGoals.length === 0) {
        setError("No goals detected in image. Try capturing a clearer photo.");
        setIsProcessing(false);
      } else {
        setExtractedGoals(newGoals);
        setShowResults(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err?.message || "Visual analysis failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    const updatedTasks = [...currentTodos, ...extractedGoals];
    onTasksUpdated(updatedTasks);
    cleanup();
    onClose();
  };

  const handleCancel = () => {
    cleanup();
    onClose();
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Scan Complete</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {extractedGoals.length} Goal{extractedGoals.length !== 1 ? 's' : ''} Detected
            </p>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {extractedGoals.map((goal, idx) => (
              <div key={idx} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${goal.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      goal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                    }`}>
                    {goal.priority}
                  </span>
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-white text-sm">{goal.goal}</h3>
                {goal.description && (
                  <p className="text-xs text-zinc-500 mt-1">{goal.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-4 rounded-[1.5rem] border-2 border-zinc-800 hover:border-zinc-600 font-black text-xs uppercase tracking-[0.4em] text-zinc-400 hover:text-white transition-all"
            >
              Discard
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-4 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all"
            >
              Add to Registry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      {/* Scanning HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 z-10 flex items-center justify-center">
        <div className="w-full max-w-sm aspect-[3/4] border-2 border-white/20 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/40 -translate-x-1 -translate-y-1" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/40 translate-x-1 -translate-y-1" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/40 -translate-x-1 translate-y-1" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/40 translate-x-1 translate-y-1" />

          {/* Scanning Line */}
          {!isProcessing && !error && (
            <div className="absolute inset-x-0 h-[2px] bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[scanner_3s_ease-in-out_infinite]" />
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanner {
          0% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
      />

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-12 left-0 right-0 z-20 flex flex-col items-center gap-8">
        {error ? (
          <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-4 rounded-[1.5rem] text-xs font-bold max-w-md text-center">
            {error}
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Analyzing Image...</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 px-6">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Point camera at notes or whiteboard</p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Tap to capture</p>
            </div>
            <button
              onClick={captureAndProcess}
              className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center group active:scale-90 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-white transition-all group-hover:scale-95" />
            </button>
          </>
        )}

        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.6em] transition-all disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Cancel Scan'}
        </button>
      </div>
    </div>
  );
};

export default ScannerMode;
