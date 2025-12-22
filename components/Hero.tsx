
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onGenerate: (prompt: string, image?: File | null) => void;
  title?: string;
  subtitle?: string;
  slideshowImages?: string[];
  promptPlaceholder?: string;
}

export const Hero: React.FC<HeroProps> = ({ 
  onGetStarted, 
  onGenerate,
  title = "Turn your imagination into Visual Reality",
  subtitle = "Create stunning, unique images in seconds using advanced AI. Describe your vision, and watch it come to life. Join today and get 3 free generations.",
  slideshowImages = [],
  promptPlaceholder = "Describe what you want to imagine..."
}) => {
  const [prompt, setPrompt] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slideshow Logic
  useEffect(() => {
    if (slideshowImages && slideshowImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [slideshowImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateClick = () => {
    if (prompt.trim() || selectedImage) {
      onGenerate(prompt, selectedImage);
    } else {
      onGetStarted();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (prompt.trim() || selectedImage)) {
      handleGenerateClick();
    }
  };

  return (
    <div id="hero-section" className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden min-h-[90vh] flex flex-col justify-center scroll-mt-20">
      {/* Background blobs OR Slideshow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {slideshowImages && slideshowImages.length > 0 ? (
           <>
             {slideshowImages.map((img, index) => (
                <div 
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-40' : 'opacity-0'}`}
                  style={{ backgroundImage: `url(${img})` }}
                />
             ))}
             <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-950/80 to-dark-950" />
           </>
        ) : (
           <>
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]" />
           </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm text-gray-300 font-medium">Powered by Gemini 2.5 Architecture</span>
        </div>

        {title === "Turn your imagination into Visual Reality" ? (
             <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white mb-8">
              Turn your imagination into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Visual Reality
              </span>
            </h1>
        ) : (
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white mb-8">{title}</h1>
        )}

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
          {subtitle}
        </p>

        {/* Prompt Input Section with Multimodal Features */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
            <div className="relative flex flex-col sm:flex-row items-center bg-dark-900 border border-white/10 rounded-2xl p-2 shadow-2xl">
              
              {/* Left Side: Sparkle & Upload */}
              <div className="flex items-center gap-2 pl-3 mb-2 sm:mb-0">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                
                <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${selectedImage ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                  title="Upload Image Reference"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Reference</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              </div>

              {/* Middle: Text Input & Preview */}
              <div className="flex-1 flex items-center px-4 w-full">
                {previewUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-500/50 mr-3 shrink-0 animate-scale-in group/preview">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      onClick={removeImage}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={promptPlaceholder}
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 focus:outline-none py-3 text-lg"
                />
              </div>

              {/* Right Side: Generate */}
              <button
                onClick={handleGenerateClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-3 shadow-xl"
              >
                {(prompt.trim() || selectedImage) ? (
                  <>Synthesize <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Try for Free</>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Inspiration:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Neon Samurai", prompt: "A holographic neon samurai in rainy Cyberpunk Tokyo, extreme detail" },
                { label: "Cosmic Whale", prompt: "Bioluminescent whale flying through a vibrant nebula space clouds" },
                { label: "Claymation Cat", prompt: "A cute fluffy cat made of colorful claymation, studio ghibli style" }
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={() => setPrompt(item.prompt)} 
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all uppercase tracking-tighter"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
