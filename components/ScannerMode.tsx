import React, { useRef, useEffect, useState, useCallback } from 'react';
import { extractTasksFromImage } from '../services/geminiService';
import { Todo, GTDSettings, NeuralPattern, UserProfile } from '../types';

interface ScannerModeProps {
  onTasksUpdated: (tasks: Todo[]) => void;
  onClose: () => void;
  currentTodos: Todo[];
  settings: GTDSettings;
  patterns?: NeuralPattern;
  user?: UserProfile | null;
}

const ScannerMode: React.FC<ScannerModeProps> = ({ onClose, onTasksUpdated, currentTodos, settings, patterns, user }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Camera access denied. Please enable permissions.");
      console.error(err);
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

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const newTasks = await extractTasksFromImage(base64Image, 'image/jpeg', currentTodos, patterns, user || undefined);
      if (newTasks.length > 0) {
        onTasksUpdated(newTasks);
        onClose();
      } else {
        setError("No tasks detected. Try a clearer angle.");
      }
    } catch (err) {
      setError("Analysis failed. Check your connection.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-black/50 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Optical Scanner</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Neural Vision Interface</p>
        </div>
        <button onClick={onClose} className="p-3 rounded-full hover:bg-zinc-900 transition-all">
          <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-10 border-2 border-white/20 rounded-[3rem]">
            <div className={`absolute inset-x-0 top-0 h-1 bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-[2000ms] ease-in-out ${isScanning ? 'translate-y-[calc(100vh-200px)]' : 'translate-y-0'}`} />
          </div>
        </div>

        {error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-xs p-6 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-[2rem] text-center">
            <p className="text-red-400 text-sm font-bold">{error}</p>
            <button onClick={startCamera} className="mt-4 px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Retry</button>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white animate-pulse">Analyzing Signal...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-10 bg-black border-t border-zinc-900 flex flex-col items-center gap-6">
        <button
          onClick={captureAndProcess}
          disabled={isScanning || !cameraActive}
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isScanning ? 'border-zinc-800' : 'border-white hover:scale-110 active:scale-95'}`}
        >
          <div className={`w-14 h-14 rounded-full ${isScanning ? 'bg-zinc-800' : 'bg-white'}`} />
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          {isScanning ? 'Processing Node' : 'Capture Visual Intent'}
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ScannerMode;
