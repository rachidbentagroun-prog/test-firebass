import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Video, Mic2, Globe2, ArrowRight, Upload, X, Play, Pause, Mic } from 'lucide-react';
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
  const [detectedIntent, setDetectedIntent] = useState<'image' | 'video' | 'audio' | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              setIsTranscribing(false);
            } else {
              interimTranscript += transcript;
              setIsTranscribing(true);
            }
          }

          // Update prompt with final transcript
          if (finalTranscript) {
            setPrompt((prev) => {
              const newPrompt = prev + finalTranscript;
              // Update detected intent
              setDetectedIntent(detectPromptIntent(newPrompt));
              return newPrompt;
            });
          }
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsTranscribing(false);
          
          if (event.error === 'not-allowed') {
            alert('🎙️ Microphone access denied.\n\nPlease allow microphone permission in your browser settings.');
          } else if (event.error === 'no-speech') {
            // Silent timeout, don't show error
          } else {
            console.log('Recognition error:', event.error);
          }
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
          setIsTranscribing(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);
  
  // TODO: Replace with your Supabase Storage URLs after uploading videos
  // Format: https://[supabase-url]/storage/v1/object/public/ai-video-previews/[filename].mp4
  const videoUrls = [
    'https://via.placeholder.com/1080x1920/000000/ffffff?text=Video+1', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/1a1a2e/0f3460?text=Video+2', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/16213e/e94560?text=Video+3', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/0f3460/533483?text=Video+4', // Replace with your CDN URL
    'https://via.placeholder.com/1080x1920/2d3561/a8dadc?text=Video+5'  // Replace with your CDN URL
  ];

  // Smart prompt detection and routing
  const detectPromptIntent = (text: string): 'image' | 'video' | 'audio' | null => {
    const lowerText = text.toLowerCase();
    
    // Image keywords
    const imageKeywords = [
      'image', 'photo', 'picture', 'illustration', 'artwork', 'portrait', 
      'logo', 'design', 'poster', 'background', 'realistic', 'anime',
      'drawing', 'sketch', 'painting', 'render', 'art', 'graphic',
      'wallpaper', 'icon', 'banner', 'thumbnail', 'cover'
    ];
    
    // Video keywords
    const videoKeywords = [
      'video', 'cinematic', 'clip', 'animation', 'reel', 'shorts',
      'movie', 'scene', 'footage', 'motion', 'vlog', 'film',
      'cinematic', 'trailer', 'sequence', 'montage', 'timelapse'
    ];
    
    // Audio/Voice keywords
    const audioKeywords = [
      'voice', 'audio', 'narration', 'speech', 'podcast', 'voiceover',
      'sound', 'music', 'song', 'talking', 'speak', 'narrator',
      'announcement', 'dialogue', 'conversation', 'interview'
    ];
    
    // Count keyword matches
    const imageScore = imageKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const videoScore = videoKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const audioScore = audioKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Determine intent based on highest score
    if (imageScore === 0 && videoScore === 0 && audioScore === 0) {
      return null; // No clear intent
    }
    
    const maxScore = Math.max(imageScore, videoScore, audioScore);
    
    if (imageScore === maxScore) return 'image';
    if (videoScore === maxScore) return 'video';
    if (audioScore === maxScore) return 'audio';
    
    return null;
  };

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;
    
    // Detect intent and route intelligently
    const intent = detectPromptIntent(trimmedPrompt);
    
    // Submit prompt first
    onSubmitPrompt(trimmedPrompt);
    
    // Route to appropriate page
    if (intent === 'image') {
      onGoToImage();
    } else if (intent === 'video') {
      onGoToVideo();
    } else if (intent === 'audio') {
      onGoToAudio();
    }
    // If no clear intent detected, stay on current page
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

  const toggleRecording = () => {
    if (!recognition) {
      // Check if speech recognition is available
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('🎙️ Voice input is not supported in your browser.\n\nPlease use Chrome, Edge, or Safari for voice recording.');
          return;
        }
      }
      alert('Voice recognition is initializing. Please try again in a moment.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Unable to start voice recording. Please check your microphone permissions.');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const buttonBase = 'group relative flex items-center justify-center gap-2.5 rounded-full border border-transparent bg-white hover:bg-slate-50 hover:border-slate-200 hover:shadow-md transition-all duration-300 text-sm font-medium py-3.5 px-5 min-h-[44px]';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      
      {/* Premium Hero Section with Motion Design */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-20 px-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          {/* Soft gradient orbs */}
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30 animate-float" />
          <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full blur-3xl opacity-30 animate-float-delayed" />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:14rem_14rem] opacity-[0.03]" />
        </div>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-4xl space-y-10">
          {/* Hero Headline with Sparkles */}
          <div className="text-center space-y-6">
            <div className="relative inline-block animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {/* Decorative sparkles */}
              <span className="absolute -top-4 -left-8 text-2xl animate-sparkle" style={{ animationDelay: '400ms' }}>✨</span>
              <span className="absolute -top-2 -right-6 text-xl animate-sparkle" style={{ animationDelay: '600ms' }}>✨</span>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
                What should we <br className="hidden sm:block" />
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient-shift">
                    build?
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full opacity-20 animate-gradient-shift"></span>
                </span>
              </h1>
            </div>
            
            {/* Subheadline with delay */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '300ms' }}>
              Create stunning images, videos, and more with AI. 
              Just describe your vision and watch it come to life.
            </p>
          </div>

          {/* Premium Prompt Input Box with Motion */}
          <div className="mt-12 mx-auto w-full max-w-3xl animate-scale-in" style={{ animationDelay: '450ms' }}>
            <div className="relative group">
              {/* Ambient glow underneath */}
              <div className="pointer-events-none absolute -inset-4 bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 rounded-3xl blur-2xl opacity-0 group-hover:opacity-40 group-focus-within:opacity-50 transition-all duration-700 -z-10" />
              
              {/* Main input container */}
              <div className="relative z-20 rounded-2xl bg-white shadow-xl hover:shadow-2xl focus-within:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200">
                {/* Animated top gradient border */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 animate-border-flow transition-opacity duration-500"></div>
                
                {/* Input section */}
                <div className="flex flex-col gap-3 p-5 sm:p-8">
                  {/* Selected file indicator (shown above input on mobile, inline on desktop) */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 border border-indigo-200 animate-fade-in">
                      <span className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</span>
                      <button onClick={removeFile} className="text-slate-500 hover:text-red-500 transition-colors flex-shrink-0 hover:scale-110" type="button">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Main input row with input field and generate button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                    
                    {/* Input field with upload icon on left and microphone on right */}
                    <div className="relative flex-1 min-w-0">
                      {/* Upload icon button - positioned inside input on left */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                          selectedFile ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Upload file"
                        type="button"
                        aria-label="Upload file"
                      >
                        <Upload className="h-5 w-5" strokeWidth={2} />
                      </button>
                      
                      <input 
                        value={prompt}
                        onChange={(e) => {
                          setPrompt(e.target.value);
                          // Update detected intent as user types
                          if (e.target.value.trim()) {
                            setDetectedIntent(detectPromptIntent(e.target.value));
                          } else {
                            setDetectedIntent(null);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecording ? (isTranscribing ? "Listening..." : "Speak now...") : "Describe your vision..."}
                        className="h-[56px] w-full rounded-xl bg-slate-50/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 focus:ring-offset-white text-[16px] sm:text-lg font-medium transition-all duration-300 pl-12 pr-14"
                        style={{ WebkitAppearance: 'none' }}
                      />
                      
                      {/* Microphone button for speech-to-text - positioned inside input on right */}
                      <div className="pointer-events-auto absolute inset-y-1 right-1 flex items-center">
                        <button
                          onClick={toggleRecording}
                          className={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                            isRecording 
                              ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                              : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                          }`}
                          title={isRecording ? 'Stop recording' : 'Click to speak'}
                          type="button"
                          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                        >
                          <Mic className="h-[20px] w-[20px]" />
                          {/* Recording pulse animation */}
                          {isRecording && (
                            <>
                              <span className="absolute inset-0 rounded-lg bg-red-500 animate-ping opacity-60"></span>
                              <span className="absolute inset-0 rounded-lg bg-red-400 animate-pulse"></span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Generate button - aligned with input */}
                    <button 
                      onClick={handleSubmit} 
                      className="relative h-[56px] flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95 flex-shrink-0"
                    >
                      Generate 
                      <ArrowRight className="h-5 w-5 transition-transform duration-300" />
                      
                      {/* Smart routing indicator */}
                      {detectedIntent && (
                        <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg animate-fade-in">
                          {detectedIntent === 'image' && '🖼️'}
                          {detectedIntent === 'video' && '🎥'}
                          {detectedIntent === 'audio' && '🔊'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Quick actions pills */}
                <div className="px-5 sm:px-8 py-6 border-t border-slate-100/80 bg-gradient-to-b from-slate-50/80 to-white/50">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button 
                      className={`${buttonBase} shadow-sm hover:scale-105 active:scale-95`} 
                      onClick={onGoToImage} 
                      title="Create Image"
                    >
                      <ImageIcon className="h-[18px] w-[18px] text-indigo-600" strokeWidth={2.5} />
                      <span className="text-slate-900 font-semibold">Image</span>
                    </button>
                    <button 
                      className={`${buttonBase} shadow-sm hover:scale-105 active:scale-95`} 
                      onClick={onGoToVideo} 
                      title="Create Video"
                    >
                      <Video className="h-[18px] w-[18px] text-purple-600" strokeWidth={2.5} />
                      <span className="text-slate-900 font-semibold">Video</span>
                    </button>
                    <button 
                      className={`${buttonBase} shadow-sm hover:scale-105 active:scale-95`} 
                      onClick={onGoToWebsite} 
                      title="Create Website"
                    >
                      <Globe2 className="h-[18px] w-[18px] text-blue-600" strokeWidth={2.5} />
                      <span className="text-slate-900 font-semibold">Website</span>
                    </button>
                    <button 
                      className={`${buttonBase} shadow-sm hover:scale-105 active:scale-95`} 
                      onClick={onGoToAudio} 
                      title="Create Audio"
                    >
                      <Mic2 className="h-[18px] w-[18px] text-pink-600" strokeWidth={2.5} />
                      <span className="text-slate-900 font-semibold">Audio</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Ideas Section */}
            <div className="mt-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Quick Inspiration ✨ Auto-routes to the right tool</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { text: "Futuristic city skyline illustration", type: "🖼️" },
                  { text: "Cinematic drone shot of mountains", type: "🎥" },
                  { text: "Professional podcast intro voiceover", type: "🔊" }
                ].map((idea) => (
                  <button 
                    key={idea.text} 
                    onClick={() => {
                      setPrompt(idea.text);
                      setDetectedIntent(detectPromptIntent(idea.text));
                    }} 
                    className="group relative text-left px-5 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{idea.type}</span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{idea.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <style>{`
        /* Premium Motion Design Animations */
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.97);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
        }
        
        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: scale(1) rotate(10deg);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.9) rotate(5deg);
          }
        }
        
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes border-flow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        
        /* Apply Animations */
        .animate-fade-in-up {
          animation: fade-in-up 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-scale-in {
          animation: scale-in 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-sparkle {
          animation: sparkle 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          display: inline-block;
          filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease-in-out infinite;
        }
        
        .animate-border-flow {
          animation: border-flow 3s linear infinite;
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        
        /* Focus Pulse Effect */
        input:focus {
          animation: focus-pulse 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes focus-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.002);
          }
          100% {
            transform: scale(1);
          }
        }
        
        /* Smooth all transitions */
        * {
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Hide scrollbars for pill list on mobile */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
