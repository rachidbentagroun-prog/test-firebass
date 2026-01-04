import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Mic2, Globe2, ArrowRight, Upload, X } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f5f7fb] to-white text-slate-900">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1f4b99]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#47526a]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-gradient-to-r from-[#1f4b99]/12 via-[#47526a]/10 to-transparent rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 w-full max-w-4xl space-y-12">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#eef1f6] to-white border border-slate-200 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-700">ImaginAI Studio</span>
            </div>
            <h1 className="text-5xl font-black sm:text-6xl md:text-7xl bg-gradient-to-r from-[#102d55] via-[#1f4b99] to-[#47526a] bg-clip-text text-transparent leading-tight">
              What can we build today?
            </h1>
            <p className="text-lg text-slate-600 sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
              Fast, focused workspace inspired by ChatGPT—describe anything and jump into the right AI tool.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/85 backdrop-blur-sm p-6 shadow-[0_24px_80px_rgba(16,45,85,0.14)] hover:shadow-[0_28px_90px_rgba(16,45,85,0.16)] transition-shadow duration-300 sm:p-8 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex w-full items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 shadow-sm hover:border-slate-300 focus-within:border-[#1f4b99] focus-within:ring-4 focus-within:ring-[#1f4b99]/10 transition-all duration-200">
                <button onClick={() => fileInputRef.current?.click()} className={`flex-shrink-0 rounded-lg p-2.5 transition-all duration-200 ${selectedFile ? 'bg-[#1f4b99] text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:scale-105'}`} title="Upload file" type="button">
                  <Upload className="h-4 w-4" />
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                {selectedFile && (
                  <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#eef1f6] to-white px-3 py-1.5 border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-800">{selectedFile.name}</span>
                    <button onClick={removeFile} className="text-slate-500 hover:text-rose-600 transition-colors" type="button">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe an image, video, website, or audio idea..." className="flex-1 border-none bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 font-medium" />
                <button onClick={toggleRecording} className={`flex-shrink-0 rounded-lg p-2.5 transition-all duration-200 ${isRecording ? 'animate-pulse bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:scale-105'}`} title={isRecording ? 'Stop recording' : 'Record audio'} type="button">
                  <Mic2 className="h-4 w-4" />
                </button>
              </div>
              <button onClick={handleSubmit} className="btn-steel w-full sm:w-auto px-8 py-4 text-sm tracking-wide">
                Send <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button className={buttonBase} onClick={onGoToImage}>
                <div className="absolute inset-0 bg-gradient-to-r from-[#eef1f6] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <ImageIcon className="h-5 w-5 relative z-10 text-[#1f4b99] group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Create Image</span>
              </button>
              <button className={buttonBase} onClick={onGoToVideo}>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-[#eef1f6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Video className="h-5 w-5 relative z-10 text-[#47526a] group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Create Video</span>
              </button>
              <button className={buttonBase} onClick={onGoToWebsite}>
                <div className="absolute inset-0 bg-gradient-to-r from-[#eef1f6] to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Globe2 className="h-5 w-5 relative z-10 text-[#1f4b99] group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Create Website</span>
              </button>
              <button className={buttonBase} onClick={onGoToAudio}>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-[#eef1f6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Mic2 className="h-5 w-5 relative z-10 text-[#47526a] group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Create Audio</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 text-center">Quick Ideas</p>
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {["Product demo video for a new wearable", "Minimal landing page for an AI startup", "Warm podcast intro voiceover"].map((idea) => (
                <button key={idea} onClick={() => setPrompt(idea)} className="group w-full rounded-xl border border-slate-200 bg-white hover:bg-gradient-to-br hover:from-[#eef1f6] hover:to-white px-4 py-4 text-left font-medium hover:border-slate-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <span className="text-slate-700 group-hover:text-slate-900">{idea}</span>
                </button>
              ))}
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
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
