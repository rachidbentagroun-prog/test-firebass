
import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
// Added missing RefreshCw import from lucide-react
import { Check, X, Crop as CropIcon, ZoomIn, ZoomOut, Maximize, RotateCcw, Shield, Layers, Layout, RefreshCw } from 'lucide-react';
import { getCanvasBlob, WATERMARK_PRESETS, WatermarkSettings, WatermarkPosition } from '../utils/imageUtils';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (newImageUrl: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSave, onCancel }) => {
  const [imgSrc] = useState(imageUrl);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'watermark'>('crop');
  
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    enabled: false,
    url: WATERMARK_PRESETS[0].url,
    opacity: 0.5,
    scale: 0.15,
    position: 'bottom-right'
  });

  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, width / height, width, height),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop({
        unit: 'px',
        x: (width - width * 0.9) / 2,
        y: (height - height * 0.9 * (width/height)) / 2,
        width: width * 0.9,
        height: height * 0.9 * (width/height)
    } as PixelCrop);
  }

  const handleSave = async () => {
    if (!imgRef.current) return;
    try {
      setIsProcessing(true);
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      let finalCrop: PixelCrop | null = null;
      if (completedCrop) {
        finalCrop = {
          unit: 'px',
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
        };
      }

      const finalUrl = await getCanvasBlob(imgSrc, finalCrop, {
        brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0
      }, watermark);
      
      onSave(finalUrl);
    } catch (e) {
      console.error(e);
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-6 bg-dark-800 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Asset Refiner</h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural Production Mode</p>
            </div>
          </div>

          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('crop')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'crop' ? 'bg-white text-dark-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <CropIcon className="w-4 h-4" /> Precision Crop
            </button>
            <button 
              onClick={() => setActiveTab('watermark')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'watermark' ? 'bg-white text-dark-950 shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              <Shield className="w-4 h-4" /> Watermarks
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={onCancel} className="p-3 text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
           <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-8 py-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isProcessing ? 'Processing...' : 'Apply & Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 bg-dark-800 border-r border-white/5 p-8 flex flex-col gap-10 overflow-y-auto no-scrollbar">
           {activeTab === 'crop' ? (
             <div className="space-y-10 animate-fade-in">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-indigo-400" /> Viewport Control
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} className="p-3 bg-black/40 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all"><ZoomIn className="w-5 h-5 mx-auto" /></button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} className="p-3 bg-black/40 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all"><ZoomOut className="w-5 h-5 mx-auto" /></button>
                  </div>
                  <button onClick={() => setZoom(1)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white transition-all">Reset Scale</button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-4 h-4 text-pink-400" /> Geometry Rules
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed uppercase">Neural assets maintain their generated aspect ratio. Precision crop allows focus refinement.</p>
                </div>
             </div>
           ) : (
             <div className="space-y-10 animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Enable Brand</h4>
                    <button 
                      onClick={() => setWatermark(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={`w-12 h-6 rounded-full transition-all relative ${watermark.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${watermark.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  <div className={`space-y-6 transition-all ${watermark.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Signature Presets</label>
                      <div className="grid grid-cols-1 gap-2">
                        {WATERMARK_PRESETS.map(preset => (
                          <button 
                            key={preset.id}
                            onClick={() => setWatermark(prev => ({ 
                              ...prev, 
                              url: preset.url,
                              opacity: preset.defaultOpacity,
                              scale: preset.defaultScale
                            }))}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${watermark.url === preset.url ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'}`}
                          >
                            <img src={preset.url} className="w-6 h-6 object-contain" alt={preset.name} />
                            <span className="text-[10px] font-bold uppercase">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                        <span>Opacity</span>
                        <span className="text-indigo-400">{Math.round(watermark.opacity * 100)}%</span>
                      </label>
                      <input 
                        type="range" min="0.1" max="1" step="0.05"
                        value={watermark.opacity}
                        onChange={(e) => setWatermark(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                        <span>Scale</span>
                        <span className="text-indigo-400">{Math.round(watermark.scale * 100)}%</span>
                      </label>
                      <input 
                        type="range" min="0.05" max="0.5" step="0.01"
                        value={watermark.scale}
                        onChange={(e) => setWatermark(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Positioning</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as WatermarkPosition[]).map(pos => (
                          <button
                            key={pos}
                            onClick={() => setWatermark(prev => ({ ...prev, position: pos }))}
                            className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${watermark.position === pos ? 'bg-indigo-600 border-indigo-500' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${watermark.position === pos ? 'bg-white' : 'bg-gray-700'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* Workspace */}
        <div className="flex-1 bg-black/20 flex items-center justify-center p-12 overflow-hidden">
          <div 
            className="relative transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-w-full max-h-[60vh]"
            >
              <img
                ref={imgRef}
                alt="Refine"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>
      </div>
    </div>
  );
};
