
import React, { useState } from 'react';
import { Sparkles, X, Maximize2, Download } from 'lucide-react';

interface ShowcaseProps {
  images: string[];
}

export const Showcase: React.FC<ShowcaseProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  if (!images || images.length === 0) return null;

  const handleImageError = (index: number) => {
    setBrokenImages(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  // Filter out images that failed to load
  const validImages = images.filter((_, idx) => !brokenImages.has(idx));
  
  // If no images are valid after filtering, don't render the section
  if (validImages.length === 0) return null;

  // Duplicate images for a smoother loop effect
  const displayImages = validImages.length < 5 
    ? [...validImages, ...validImages, ...validImages, ...validImages] 
    : [...validImages, ...validImages];

  const closePreview = () => setSelectedImage(null);

  return (
    <div className="py-12 bg-dark-950 border-b border-white/5 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2 uppercase tracking-tighter italic">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Generated with ImaginAI
        </h2>
        <p className="text-gray-400 text-sm mt-1 font-medium">High-resolution 4K masterpieces created by our neural engine</p>
      </div>

      <div className="relative flex w-full overflow-hidden group">
        <div className="flex animate-scroll hover:pause gap-4 whitespace-nowrap py-4">
          {displayImages.map((src, index) => (
            <div 
              key={`${index}`} 
              onClick={() => setSelectedImage(src)}
              className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0 rounded-[2rem] overflow-hidden border border-white/10 relative cursor-zoom-in group/item transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 bg-dark-900"
            >
              <img 
                src={src} 
                alt="AI Generation" 
                onError={() => handleImageError(index % validImages.length)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-all flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-600 px-2 py-1 rounded shadow-lg">4K Render</span>
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Gradient Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-dark-950/95 backdrop-blur-xl animate-fade-in"
          onClick={closePreview}
        >
          <div 
            className="relative max-w-5xl w-full max-h-full flex flex-col items-center animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Toolbar */}
            <div className="absolute -top-14 right-0 flex gap-3">
              <a 
                href={selectedImage} 
                target="_blank"
                rel="noopener noreferrer"
                download="imaginai-masterpiece.jpg"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10 backdrop-blur-md"
                title="Download Masterpiece"
              >
                <Download className="w-5 h-5" />
              </a>
              <button 
                onClick={closePreview}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white transition-all shadow-xl shadow-indigo-600/20"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-dark-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img 
                src={selectedImage} 
                alt="AI Masterpiece" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <div>
                   <p className="text-white font-black uppercase tracking-tight text-sm italic">Neural Masterpiece</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Synthesized in 4K Fidelity • Gemini 2.5 Image</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black text-indigo-400 uppercase">Production Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
