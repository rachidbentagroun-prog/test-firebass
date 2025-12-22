
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, Download, RefreshCw, Sliders, Palette, 
  RotateCcw, Play, Pause, MonitorPlay, Zap, 
  Maximize, Activity, ShieldCheck, DownloadCloud
} from 'lucide-react';

interface VideoEditorProps {
  videoUrl: string;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

interface VideoFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const DEFAULT_FILTERS: VideoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

export const VideoEditor: React.FC<VideoEditorProps> = ({ videoUrl, onClose, onSave }) => {
  const [filters, setFilters] = useState<VideoFilters>(DEFAULT_FILTERS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFilterChange = (key: keyof VideoFilters, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getFilterString = () => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const handleExport = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas to video source resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      onSave(url);
      setIsExporting(false);
    };

    // Prepare video for re-recording
    video.pause();
    video.currentTime = 0;
    
    await new Promise(resolve => {
        video.onseeked = resolve;
    });

    recorder.start();

    const duration = video.duration;
    const startTime = Date.now();

    const recordFrame = () => {
      if (video.ended) {
        recorder.stop();
        return;
      }

      ctx.filter = getFilterString();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      setExportProgress((video.currentTime / duration) * 100);
      
      requestAnimationFrame(recordFrame);
    };

    video.play();
    recordFrame();
  };

  return (
    <div className="bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] h-full flex flex-col animate-scale-in">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
            <MonitorPlay className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Color Grading Engine</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-time Cinematic LUTs</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-xl text-gray-500 transition-all"><X className="w-5 h-5" /></button>
           <button 
             onClick={handleExport}
             disabled={isExporting}
             className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
           >
             {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
             {isExporting ? `Processing ${Math.round(exportProgress)}%` : 'Commit & Export'}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 bg-black flex items-center justify-center p-8 relative overflow-hidden">
           <div className="relative group max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl">
              <video 
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted
                className="max-w-full max-h-[50vh] lg:max-h-full shadow-2xl transition-all"
                style={{ filter: getFilterString() }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <button 
                onClick={() => {
                  if (videoRef.current?.paused) videoRef.current.play();
                  else videoRef.current?.pause();
                  setIsPlaying(!isPlaying);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? <Pause className="w-12 h-12 text-white fill-white" /> : <Play className="w-12 h-12 text-white fill-white ml-2" />}
              </button>
           </div>
           
           {isExporting && (
             <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <div className="w-24 h-24 border-b-4 border-indigo-500 rounded-full animate-spin mb-8" />
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Encoding Production</h4>
                <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] mt-2">Baking Latent Filters... {Math.round(exportProgress)}%</p>
             </div>
           )}
        </div>

        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 bg-dark-800 border-l border-white/5 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-10">
           <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" /> Adjustments
              </h4>
              <button onClick={resetFilters} className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
           </div>

           <div className="space-y-8">
              {[
                { key: 'brightness', label: 'Brightness', min: 0, max: 200 },
                { key: 'contrast', label: 'Contrast', min: 0, max: 200 },
                { key: 'saturation', label: 'Saturation', min: 0, max: 200 },
                { key: 'sepia', label: 'Vintage (Sepia)', min: 0, max: 100 },
                { key: 'grayscale', label: 'Atmosphere (B&W)', min: 0, max: 100 },
                { key: 'blur', label: 'Depth (Blur)', min: 0, max: 10 },
              ].map(f => (
                <div key={f.key} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="text-indigo-400">{filters[f.key as keyof VideoFilters]}{f.key === 'blur' ? 'px' : '%'}</span>
                  </div>
                  <input 
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.key === 'blur' ? 0.5 : 1}
                    value={filters[f.key as keyof VideoFilters]}
                    onChange={e => handleFilterChange(f.key as keyof VideoFilters, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}
           </div>

           <div className="mt-auto pt-10 border-t border-white/5 text-center">
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-[9px] text-left text-gray-400 leading-relaxed font-bold uppercase tracking-tight">
                  High-Fidelity Export: commit changes to synchronize with your creation library.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
