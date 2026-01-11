
import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, Download, Image as ImageIcon, Video as VideoIcon, 
  Play, Pause, Volume2, Headphones, X, Maximize2, 
  ExternalLink, Calendar, Clock, Sparkles, ZoomIn, ZoomOut, RotateCcw, Eye
} from 'lucide-react';
import { GeneratedImage, GeneratedVideo, GeneratedAudio } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  videos?: GeneratedVideo[];
  audioGallery?: GeneratedAudio[];
  onDelete: (id: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ images, videos = [], audioGallery = [], onDelete }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio'>('images');
  const [previewAsset, setPreviewAsset] = useState<{ type: 'image' | 'video'; url: string; prompt: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset zoom when asset changes
  useEffect(() => {
    setZoom(1);
  }, [previewAsset]);

  const handlePlayAudio = (audio: GeneratedAudio) => {
    try {
      if (playingAudioId === audio.id) {
        audioRef.current?.pause();
        setPlayingAudioId(null);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        const newAudio = new Audio(audio.url);
        audioRef.current = newAudio;
        newAudio.onended = () => {
          setPlayingAudioId(null);
          newAudio.src = '';
        };
        newAudio.onerror = (e) => {
          console.error('❌ Gallery audio playback error:', e);
          setPlayingAudioId(null);
        };
        newAudio.play().catch(err => {
          console.error('❌ Gallery audio play failed:', err);
          setPlayingAudioId(null);
        });
        setPlayingAudioId(audio.id);
      }
    } catch (err) {
      console.error('❌ Gallery handlePlayAudio error:', err);
      setPlayingAudioId(null);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  const currentCount = activeTab === 'images' ? images.length : (activeTab === 'videos' ? videos.length : audioGallery.length);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 animate-fade-in min-h-[70vh]">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">Creation Vault</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{currentCount} Authorized Nodes Synchronized</span>
          </div>
        </div>

        <div className="flex bg-dark-900/50 p-1 sm:p-1.5 rounded-2xl sm:rounded-[1.5rem] border border-white/10 shadow-2xl backdrop-blur-md w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'images', icon: ImageIcon, label: 'Images' },
            { id: 'videos', icon: VideoIcon, label: 'Videos' },
            { id: 'audio', icon: Headphones, label: 'Audio' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Grid Content */}
      <div className="animate-fade-in">
        {activeTab === 'images' && (
          images.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No Visual projections found" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {images.map((img) => (
                <ImageCard 
                  key={img.id} 
                  img={img} 
                  onPreview={() => setPreviewAsset({ type: 'image', url: img.url, prompt: img.prompt })} 
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'videos' && (
          videos.length === 0 ? (
            <EmptyState icon={VideoIcon} title="No Temporal sequences detected" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {videos.map((vid) => (
                <VideoCard 
                  key={vid.id} 
                  video={vid} 
                  onPreview={() => setPreviewAsset({ type: 'video', url: vid.url, prompt: vid.prompt })} 
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'audio' && (
          audioGallery.length === 0 ? (
            <EmptyState icon={Headphones} title="No Neural vocalizations stored" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {audioGallery.map((audio) => (
                <AudioCard 
                  key={audio.id} 
                  audio={audio} 
                  onPlay={() => handlePlayAudio(audio)}
                  isPlaying={playingAudioId === audio.id}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-dark-950/98 backdrop-blur-3xl animate-fade-in">
          <div className="relative w-full max-w-6xl max-h-full flex flex-col bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-scale-in">
            {/* Top Toolbar */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
              {/* Zoom Controls */}
              <div className="flex bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-1 mr-2">
                <button onClick={handleZoomOut} className="p-3 text-gray-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={handleZoomReset} className="px-3 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest border-x border-white/5" title="Reset Zoom">{Math.round(zoom * 100)}%</button>
                <button onClick={handleZoomIn} className="p-3 text-gray-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
              </div>

              <a 
                href={previewAsset.url} 
                download={`imaginai-export.${previewAsset.type === 'video' ? 'mp4' : 'png'}`}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white backdrop-blur-md transition-all border border-white/10"
                title="Download Asset"
              >
                <Download className="w-6 h-6" />
              </a>
              <button 
                onClick={() => setPreviewAsset(null)}
                className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white shadow-xl shadow-indigo-600/20 transition-all"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content Viewport */}
            <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-4 md:p-12 overflow-auto custom-scrollbar">
              <div 
                className="relative transition-transform duration-300 ease-out origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                {previewAsset.type === 'image' ? (
                  <img src={previewAsset.url} className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" alt="Preview" />
                ) : (
                  <video src={previewAsset.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl" />
                )}
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-8 md:p-12 bg-dark-800/80 border-t border-white/5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                     Neural Masterpiece
                   </span>
                 </div>
                 <p className="text-white text-lg md:text-xl font-bold italic leading-relaxed">"{previewAsset.prompt}"</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Protocol Type</p>
                  <p className="text-sm font-black text-white uppercase italic">{previewAsset.type} SYNC</p>
                </div>
                {/* Delete button removed as requested */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageCard: React.FC<{ img: GeneratedImage; onPreview: () => void }> = ({ img, onPreview }) => (
  <div className="group relative aspect-square rounded-[2.5rem] overflow-hidden bg-dark-900 border border-white/5 shadow-2xl transition-all hover:-translate-y-2 hover:border-indigo-500/30">
    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-end">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Render</span>
      </div>
      <p className="text-gray-300 text-xs font-medium line-clamp-2 mb-6 italic leading-relaxed">"{img.prompt}"</p>
      <div className="flex items-center justify-between border-t border-white/10 pt-6">
        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(img.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-2">
          <button onClick={onPreview} className="p-3 bg-white/10 hover:bg-indigo-600 text-white rounded-xl backdrop-blur-md transition-all"><Maximize2 className="w-4 h-4" /></button>
          <a href={img.url} download className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"><Download className="w-4 h-4" /></a>
          {/* Delete button removed */}
        </div>
      </div>
    </div>
  </div>
);

const VideoCard: React.FC<{ video: GeneratedVideo; onPreview: () => void }> = ({ video, onPreview }) => (
  <div className="group relative rounded-[3rem] overflow-hidden bg-dark-900 border border-white/5 shadow-2xl transition-all hover:border-indigo-500/30">
    <div className="aspect-video relative bg-black overflow-hidden" onClick={onPreview}>
      <video src={video.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loop muted onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
        <div className="p-6 bg-white/10 backdrop-blur-md rounded-full border border-white/10"><Play className="w-8 h-8 text-white fill-white" /></div>
      </div>
      <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-indigo-400 border border-indigo-500/30 uppercase tracking-[0.2em]">{video.resolution} • SORA 2</div>
    </div>
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
            <VideoIcon className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Motion Sequence</span>
         </div>
         <button onClick={onPreview} className="text-indigo-400 hover:text-white transition-colors"><Maximize2 className="w-4 h-4" /></button>
      </div>
      <p className="text-gray-300 text-sm font-medium line-clamp-2 mb-8 italic leading-relaxed">"{video.prompt}"</p>
      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex flex-col">
           <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Projection Timestamp</span>
           <span className="text-[10px] text-gray-400 font-bold">{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <a href={video.url} download className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all"><Download className="w-4 h-4" /></a>
          {/* Delete button removed */}
        </div>
      </div>
    </div>
  </div>
);

const AudioCard: React.FC<{ audio: GeneratedAudio; onPlay: () => void; isPlaying: boolean }> = ({ audio, onPlay, isPlaying }) => (
  <div className="bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 shadow-xl hover:border-pink-500/30 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/5 blur-[50px] rounded-full -mr-12 -mt-12 group-hover:bg-pink-600/10 transition-all" />
    
    <div className="flex items-center gap-6 mb-6 relative z-10">
      <button 
        onClick={onPlay}
        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isPlaying ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-white/5 text-pink-400 group-hover:bg-white/10 border border-white/10'}`}
      >
        {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Volume2 className="w-8 h-8" />}
      </button>
      <div className="flex-1 overflow-hidden">
        <h4 className="text-base font-black text-white uppercase tracking-tight truncate italic">{audio.voice} Persona</h4>
        <div className="flex items-center gap-2 mt-1">
           <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(audio.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>

    <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 min-h-[80px] relative z-10">
       <p className="text-[11px] text-gray-400 line-clamp-3 italic leading-relaxed">"{audio.text}"</p>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-600 uppercase">
            <Clock className="w-3 h-3" /> Synthesis complete
         </div>
      </div>
      <div className="flex gap-2">
        <a href={audio.url} download={`imaginai-audio-${audio.id}.wav`} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"><Download className="w-4 h-4" /></a>
        {/* Delete button removed */}
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <div className="relative mb-10">
       <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
          <Icon className="w-12 h-12 text-gray-700 opacity-20" />
       </div>
       <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-indigo-400/20" />
    </div>
    <h3 className="text-xl font-black uppercase tracking-[0.3em] text-gray-600 mb-2 italic">{title}</h3>
    <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Initialize neural production to populate vault history</p>
  </div>
);
