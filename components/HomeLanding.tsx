import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Video, Mic2, Globe2, ArrowRight, Upload, X, Play, Pause } from 'lucide-react';
import VideoCarousel from './VideoCarousel';

interface HomeLandingProps {
  onSubmitPrompt: (prompt: string) => void;
  onGoToImage: () => void;
  onGoToVideo: () => void;
  onGoToWebsite: () => void;
  onGoToAudio: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({
  onSubmitPrompt,
  onGoToImage,
  onGoToVideo,
  onGoToWebsite,
  onGoToAudio,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // TODO: Replace with your Supabase Storage URLs after uploading videos
  // Format: https://[supabase-url]/storage/v1/object/public/ai-video-previews/[filename].mp4
  const videoUrls = [
    'https://via.placeholder.com/1080x1920/000000/ffffff?text=Video+1', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/1a1a2e/0f3460?text=Video+2', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/16213e/e94560?text=Video+3', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/0f3460/533483?text=Video+4', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/2d3561/a8dadc?text=Video+5'  // Replace with your CDN URL
  ];

  const handleSubmit = () => {
    onSubmitPrompt(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in your browser.');
        return;
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'en-US';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;
      recognitionInstance.onstart = () => setIsRecording(true);
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setPrompt(prev => prev ? `${prev} ${finalTranscript}`.trim() : finalTranscript.trim());
        }
      };
      recognitionInstance.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied.');
        }
      };
      recognitionInstance.onend = () => {
        setIsRecording(false);
        setRecognition(null);
      };
      recognitionInstance.start();
      setRecognition(recognitionInstance);
    } catch (error) {
      alert('Could not access microphone.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const buttonBase = 'group relative flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-300 text-sm font-semibold py-3 px-4 overflow-hidden text-slate-800';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      
      {/* Premium Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-20 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          {/* Gradient orbs */}
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:14rem_14rem] opacity-[0.05]" />
        </div>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-4xl space-y-8">
          {/* Badge - Premium style */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-700">Powered by Sora & Gemini 2.5</span>
            </div>
          </div>

          {/* Main Heading - Premium Typography */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Turn your <br className="hidden sm:block" />
              imagination into <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                visual reality
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Create stunning, unique images and cinematic videos in seconds. 
              Just describe your vision and watch it come to life instantly.
            </p>
          </div>

          {/* Premium Input Box - Stripe/Vercel inspired */}
          <div className="mt-12 mx-auto w-full max-w-3xl">
            <div className="relative group">
              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition duration-500 -z-10" />
              
              {/* Main container */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Input section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center p-6 sm:p-7 border-b border-slate-100">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className={`flex-shrink-0 rounded-lg p-3 transition-all duration-200 ${selectedFile ? 'bg-indigo-100 text-indigo-600 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} 
                    title="Upload file" 
                    type="button"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                  
                  {selectedFile && (
                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 border border-indigo-200">
                      <span className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</span>
                      <button onClick={removeFile} className="text-slate-500 hover:text-red-500 transition-colors flex-shrink-0" type="button">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <input 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your vision..."
                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-lg font-medium"
                  />
                  
                  <button 
                    onClick={handleSubmit} 
                    className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3.5 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    Generate <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Quick actions grid */}
                <div className="px-6 sm:px-7 py-5 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button 
                      className={`${buttonBase}`} 
                      onClick={onGoToImage} 
                      title="Create Image"
                    >
                      <ImageIcon className="h-5 w-5 text-indigo-600" />
                      <span className="hidden sm:inline text-slate-900">Image</span>
                    </button>
                    <button 
                      className={`${buttonBase}`} 
                      onClick={onGoToVideo} 
                      title="Create Video"
                    >
                      <Video className="h-5 w-5 text-purple-600" />
                      <span className="hidden sm:inline text-slate-900">Video</span>
                    </button>
                    <button 
                      className={`${buttonBase}`} 
                      onClick={onGoToWebsite} 
                      title="Create Website"
                    >
                      <Globe2 className="h-5 w-5 text-blue-600" />
                      <span className="hidden sm:inline text-slate-900">Website</span>
                    </button>
                    <button 
                      className={`${buttonBase}`} 
                      onClick={onGoToAudio} 
                      title="Create Audio"
                    >
                      <Mic2 className="h-5 w-5 text-pink-600" />
                      <span className="hidden sm:inline text-slate-900">Audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Ideas Section */}
            <div className="mt-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Quick Inspiration</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {["Product demo video for a new wearable", "Minimal landing page for an AI startup", "Warm podcast intro voiceover"].map((idea) => (
                  <button 
                    key={idea} 
                    onClick={() => setPrompt(idea)} 
                    className="group relative text-left px-5 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative text-sm font-medium text-slate-700 group-hover:text-slate-900">{idea}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
