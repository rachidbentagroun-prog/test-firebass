
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
    <div id="hero-section" className="relative pt-16 pb-10 sm:pt-20 md:pt-24 lg:pt-32 sm:pb-12 md:pb-16 lg:pb-20 overflow-hidden min-h-[90vh] sm:min-h-screen flex flex-col justify-center scroll-mt-20">
      {/* Background blobs OR Slideshow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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
            <div className="absolute top-10 sm:top-20 left-1/4 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-purple-600/20 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px]" />
            <div className="absolute bottom-10 sm:bottom-20 right-1/4 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-indigo-600/20 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px]" />
           </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center w-full">
        <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6 md:mb-8 animate-fade-in text-center">
          <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>
          <span className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-medium">Powered by Gemini 2.5 Architecture</span>
        </div>

        {title === "Turn your imagination into Visual Reality" ? (
             <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0 leading-tight">
              Turn your imagination into <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Visual Reality
              </span>
            </h1>
        ) : (
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white mb-4 sm:mb-6 md:mb-8 leading-tight">{title}</h1>
        )}

        <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
          {subtitle}
        </p>

        {/* Prompt Input Section with Multimodal Features */}
        <div className="max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-12 px-2 sm:px-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 sm:-inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-dark-900 border border-white/10 rounded-lg sm:rounded-2xl p-1.5 sm:p-3 shadow-2xl gap-1.5 sm:gap-0">
              
              {/* Left Side: Sparkle & Upload */}
              <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-3">
                <div className="p-1.5 sm:p-2 bg-white/5 rounded-lg">
                  <Sparkles className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 text-indigo-400" />
                </div>
                
                <div className="h-6 sm:h-8 w-px bg-white/10 mx-1 sm:mx-2 hidden sm:block" />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${selectedImage ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                  title="Upload Image Reference"
                >
                  <Upload className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden lg:block ml-1">Ref</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              </div>

              {/* Middle: Text Input & Preview */}
              <div className="flex-1 flex items-center px-2 sm:px-4 w-full min-h-[44px]">
                {previewUrl && (
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-indigo-500/50 mr-2 shrink-0 animate-scale-in group/preview">
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      onClick={removeImage}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                )}
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={promptPlaceholder}
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm md:text-base text-white placeholder-gray-600 focus:ring-0 focus:outline-none py-3 sm:py-4 px-1"
                />
              </div>

              {/* Right Side: Generate */}
              <button
                onClick={handleGenerateClick}
                className="w-full sm:w-auto px-3 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 shadow-xl min-h-[44px] flex-shrink-0 m-1 sm:m-0"
              >
                {(prompt.trim() || selectedImage) ? (
                  <>
                    <span className="hidden sm:inline">Synthesize</span>
                    <span className="sm:hidden">Generate</span>
                    <ArrowRight className="w-2.5 sm:w-3 md:w-4 h-2.5 sm:h-3 md:h-4" />
                  </>
                ) : (
                  <>Try Free</>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col gap-2 sm:gap-3">
            <p className="text-[8px] sm:text-xs text-gray-500 font-black uppercase tracking-widest">Quick Ideas:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Neon Samurai", prompt: "A holographic neon samurai in rainy Cyberpunk Tokyo, extreme detail" },
                { label: "Cosmic Whale", prompt: "Bioluminescent whale flying through a vibrant nebula space clouds" },
                { label: "Claymation Cat", prompt: "A cute fluffy cat made of colorful claymation, studio ghibli style" }
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={() => setPrompt(item.prompt)} 
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-[8px] sm:text-[9px] font-bold text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all uppercase tracking-tighter flex items-center min-h-[32px]"
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
