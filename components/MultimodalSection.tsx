
import React from 'react';
import { ImageIcon, Video, Mic2, ArrowRight, Sparkles, Zap, Headphones } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface MultimodalSectionProps {
  onNavigate: (page: string) => void;
  onLoginClick: () => void;
  isRegistered: boolean;
  isIdentityCheckActive?: boolean;
}

export const MultimodalSection: React.FC<MultimodalSectionProps> = ({ onNavigate, onLoginClick, isRegistered, isIdentityCheckActive = false }) => {
  const { t } = useLanguage();
  
  const services = [
    {
      id: 'image',
      title: t('multimodal.aiImage'),
      subtitle: t('multimodal.imageSubtitle'),
      description: t('multimodal.imageDesc'),
      icon: ImageIcon,
      color: 'indigo',
      page: 'dashboard',
      gradient: 'from-indigo-600/20 to-blue-600/20',
      glow: 'group-hover:shadow-indigo-500/20'
    },
    {
      id: 'video',
      title: t('multimodal.aiVideo'),
      subtitle: t('multimodal.videoSubtitle'),
      description: t('multimodal.videoDesc'),
      icon: Video,
      color: 'purple',
      page: 'video-lab-landing',
      gradient: 'from-purple-600/20 to-indigo-600/20',
      glow: 'group-hover:shadow-purple-500/20'
    },
    {
      id: 'voiceover',
      title: t('multimodal.aiVoice'),
      subtitle: t('multimodal.voiceSubtitle'),
      description: t('multimodal.voiceDesc'),
      icon: Mic2,
      color: 'pink',
      page: isRegistered ? 'tts-generator' : 'auth',
      gradient: 'from-pink-600/20 to-purple-600/20',
      glow: 'group-hover:shadow-pink-500/20'
    }
  ];

  const handleClick = (page: string) => {
    if (page === 'dashboard' && !isRegistered) {
      onLoginClick();
    } else {
      onNavigate(page);
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-dark-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-indigo-600/5 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-600/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-1">
          <h2 className="text-[10px] sm:text-xs md:text-sm font-black text-indigo-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] mb-3 sm:mb-4">{t('multimodal.title')}</h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">{t('multimodal.subtitle')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              onClick={() => handleClick(service.page)}
              className={`group relative bg-dark-900 border border-white/10 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-1 sm:p-1.5 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-${service.color}-500/50 shadow-2xl ${service.glow}`}
            >
              <div className={`h-full w-full bg-gradient-to-br ${service.gradient} rounded-xl sm:rounded-[1.8rem] md:rounded-[2.3rem] p-5 sm:p-8 md:p-10 flex flex-col items-center text-center overflow-hidden relative`}>
                {/* Background Icon Watermark */}
                <service.icon className={`absolute -right-6 -bottom-6 sm:-right-8 sm:-bottom-8 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.03] text-white rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110`} />
                
                <div className={`mb-4 sm:mb-6 md:mb-8 p-4 sm:p-5 md:p-6 bg-dark-950 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:border-${service.color}-500/30`}>
                  <service.icon className={`w-6 sm:w-8 md:w-10 h-6 sm:h-8 md:h-10 text-${service.color}-400`} />
                </div>

                <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                  <h4 className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-${service.color}-400`}>{service.subtitle}</h4>
                  <h5 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">{service.title}</h5>
                </div>

                <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10 px-2">
                  {service.description}
                </p>

                <div className={`mt-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest transition-all group-hover:bg-${service.color}-600 group-hover:border-${service.color}-500 group-hover:shadow-lg group-hover:shadow-${service.color}-600/20`}>
                  GENERATE FREE <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
