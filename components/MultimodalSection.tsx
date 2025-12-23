
import React from 'react';
import { ImageIcon, Video, Mic2, ArrowRight, Sparkles, Zap, Headphones } from 'lucide-react';

interface MultimodalSectionProps {
  onNavigate: (page: string) => void;
  onLoginClick: () => void;
  isRegistered: boolean;
  isIdentityCheckActive?: boolean;
}

export const MultimodalSection: React.FC<MultimodalSectionProps> = ({ onNavigate, onLoginClick, isRegistered, isIdentityCheckActive = false }) => {
  const services = [
    {
      id: 'image',
      title: 'Ai Image',
      subtitle: 'Synthesis Studio',
      description: 'Generate stunning 4K visuals from text or reference images using Gemini 2.5 Image.',
      icon: ImageIcon,
      color: 'indigo',
      page: isRegistered ? 'dashboard' : 'auth',
      gradient: 'from-indigo-600/20 to-blue-600/20',
      glow: 'group-hover:shadow-indigo-500/20'
    },
    {
      id: 'video',
      title: 'Ai Video',
      subtitle: 'Evolution Lab',
      description: 'Create cinematic 1080p and 4K sequences with temporal consistency via Sora 2.',
      icon: Video,
      color: 'purple',
      page: 'video-lab-landing',
      gradient: 'from-purple-600/20 to-indigo-600/20',
      glow: 'group-hover:shadow-purple-500/20'
    },
    {
      id: 'voiceover',
      title: 'Ai Voice & Audio',
      subtitle: 'Neural Moteur',
      description: 'Transform scripts into studio-quality narration with 10+ distinct neural personas.',
      icon: Mic2,
      color: 'pink',
      page: 'tts-lab-landing',
      gradient: 'from-pink-600/20 to-purple-600/20',
      glow: 'group-hover:shadow-pink-500/20'
    }
  ];

  const handleClick = (page: string) => {
    if (page === 'auth') {
      onLoginClick();
    } else {
      onNavigate(page);
    }
  };

  return (
    <section className="py-24 bg-dark-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">The Multimodal Frontier</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Choose Your Creative Path</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              onClick={() => handleClick(service.page)}
              className={`group relative bg-dark-900 border border-white/10 rounded-[2.5rem] p-1.5 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-${service.color}-500/50 shadow-2xl ${service.glow}`}
            >
              <div className={`h-full w-full bg-gradient-to-br ${service.gradient} rounded-[2.3rem] p-10 flex flex-col items-center text-center overflow-hidden relative`}>
                {/* Background Icon Watermark */}
                <service.icon className={`absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.03] text-white rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110`} />
                
                <div className={`mb-8 p-6 bg-dark-950 rounded-3xl border border-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:border-${service.color}-500/30`}>
                  <service.icon className={`w-10 h-10 text-${service.color}-400`} />
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] text-${service.color}-400`}>{service.subtitle}</h4>
                  <h5 className="text-3xl font-black text-white tracking-tighter italic uppercase">{service.title}</h5>
                </div>

                <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10 px-2">
                  {service.description}
                </p>

                <div className={`mt-auto flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest transition-all group-hover:bg-${service.color}-600 group-hover:border-${service.color}-500 group-hover:shadow-lg group-hover:shadow-${service.color}-600/20`}>
                  GENERATE FREE <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
