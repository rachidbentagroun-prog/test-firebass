            {/* CTA button at end of homepage */}
            <div className="w-full flex justify-center py-10 bg-transparent">
              <button
                onClick={() => onNavigate('aivideo')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xl"
              >
                <Video className="h-6 w-6" />
                <span>أنشئ الفيديو الخاص بك</span>
              </button>
            </div>
import React, { Suspense } from 'react';
import { Video, ArrowRight } from 'lucide-react';
const VimeoEmbed = React.lazy(() => import('./VimeoEmbed'));
import { useLanguage } from '../utils/i18n';

interface HomeLandingProps {
  onGoToVideo: () => void;
  onNavigate: (page: string) => void;
}

export const HomeLanding = ({ onGoToVideo, onNavigate }: HomeLandingProps): React.ReactElement => {
  const { t, language, setLanguage } = useLanguage();
  const [inputValue, setInputValue] = React.useState('');
  const navigateToVideoLab = () => {
    if (inputValue.trim()) {
      // Use window.location for navigation with query param (if no router)
      window.location.href = `/videolab?prompt=${encodeURIComponent(inputValue.trim())}`;
    } else {
      // fallback: just go to video lab
      window.location.href = '/videolab';
    }
  };
  const homepageVideos = [
    {
      vimeoEmbed: true,
      url: 'https://player.vimeo.com/video/1156344244?badge=0&autopause=0&player_id=0&app_id=58479',
      title: 'Vimeo Video 2',
      description: 'Second Vimeo video in the slideshow.'
    },
    {
      vimeoEmbed: true,
      url: 'https://player.vimeo.com/video/1156344229?badge=0&autopause=0&player_id=0&app_id=58479',
      title: 'كيف تعمل فيديوهات إعلانية تجيب مبيعات',
      description: '#fyp #fypシ #fypreelsシ゚ #foryou #foryoupage'
    }
  ];
  
  // Only static homepageVideos and useLanguage remain
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-20 px-4">
          <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30 animate-float" />
            <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full blur-3xl opacity-30 animate-float-delayed" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:14rem_14rem] opacity-[0.03]" />
          </div>
          <div className="relative z-10 w-full max-w-4xl space-y-10">
            <div className="text-center space-y-6">
              <div className="relative inline-block animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <span className="absolute -top-4 -left-8 text-2xl animate-sparkle" style={{ animationDelay: '400ms' }}>✨</span>
                <span className="absolute -top-2 -right-6 text-xl animate-sparkle" style={{ animationDelay: '600ms' }}>✨</span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  {t('homeLanding.heroTitle')}
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '300ms' }}>
                {t('homeLanding.heroSubtitle')}
              </p>
              {/* Restored Input Box with Upload, Audio, and 4 Buttons */}
              <div className="mt-8 flex flex-col items-center w-full">
                {/* Futuristic, glassmorphic, responsive input box */}
                <div className="w-full max-w-xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 px-2 py-2 flex items-center gap-2 sm:gap-3 glassmorphism-input transition-all duration-300 ring-1 ring-indigo-100/30 focus-within:ring-2 focus-within:ring-indigo-400/40">
                  {/* Upload Icon (left) */}
                  <label className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-100/60 to-white/30 hover:from-indigo-200/80 hover:to-white/60 border border-indigo-200/30 shadow-md transition cursor-pointer" title="Upload file">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          try {
                            localStorage.setItem('ai_video_reference_image', reader.result as string);
                          } catch {}
                          onNavigate('aivideo');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {/* Input Field */}
                  <input
                    type="text"
                    className="flex-1 h-11 sm:h-12 px-3 sm:px-4 rounded-xl border-none focus:ring-2 focus:ring-indigo-200 text-base sm:text-lg bg-transparent outline-none placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="صف ما تريد إنشاءه... (مثال: 'منظر مدينة مستقبلي عند الغروب')"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                  />
                  {/* Audio Record Icon (right) - functional */}
                  <button
                    className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-100/60 to-white/30 hover:from-pink-200/80 hover:to-white/60 border border-pink-200/30 shadow-md transition"
                    title="Record audio"
                    type="button"
                    onClick={() => {
                      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                        alert('متصفحك لا يدعم تحويل الصوت إلى نص. يرجى استخدام متصفح حديث مثل Chrome.');
                        return;
                      }
                      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      const recognition = new SpeechRecognition();
                      recognition.lang = language || 'ar';
                      recognition.interimResults = false;
                      recognition.maxAlternatives = 1;
                      recognition.onresult = (event: any) => {
                        const transcript = event.results[0][0].transcript;
                        setInputValue(transcript);
                      };
                      recognition.onerror = (event: any) => {
                        alert('حدث خطأ أثناء التسجيل: ' + event.error);
                      };
                      recognition.start();
                    }}
                  >
                    <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v4m0 0h4m-4 0H8m8-4a4 4 0 01-8 0V6a4 4 0 018 0v8z" /></svg>
                  </button>
                  {/* Create Button */}
                  <button
                    className="flex items-center justify-center h-11 sm:h-12 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg transition ml-2"
                    title="Create"
                    onClick={navigateToVideoLab}
                  >
                    إنشاء
                  </button>
                </div>
                {/* Quick Action Buttons - responsive grid */}
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 mt-4 w-full max-w-xl">
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-xl bg-white/80 text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-50 border border-indigo-100 shadow transition backdrop-blur-md"
                    onClick={() => onNavigate('aiimage')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                    Image
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-xl bg-white/80 text-purple-700 font-bold text-xs sm:text-sm hover:bg-purple-50 border border-purple-100 shadow transition backdrop-blur-md"
                    onClick={() => onNavigate('aivideo')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Video
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-xl bg-white/80 text-blue-700 font-bold text-xs sm:text-sm hover:bg-blue-50 border border-blue-100 shadow transition backdrop-blur-md"
                    onClick={() => onNavigate('chat-landing')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></svg>
                    Website
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-xl bg-white/80 text-pink-700 font-bold text-xs sm:text-sm hover:bg-pink-50 border border-pink-100 shadow transition backdrop-blur-md"
                    onClick={() => onNavigate('aivoice')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19V6a3 3 0 016 0v13" /><rect x="5" y="19" width="14" height="2" rx="1" /></svg>
                    Audio
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-16">
              <div className="text-center mb-8">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-700"><b>THIS WEBSITE PARTNER WITH OPENAI .</b></div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('homeLanding.ugcTitleShort')}</h3>
                <p className="text-slate-600">{t('homeLanding.watchExamples')}</p>
              </div>
                <div className="relative max-w-md mx-auto group flex flex-col gap-8">
                  {/* First Vimeo video */}
                  <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900" style={{ aspectRatio: '9/16' }}>
                    <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center">Loading…</div>}>
                      <VimeoEmbed
                        url={homepageVideos[0].url}
                        title={homepageVideos[0].title}
                        className="w-full h-full object-cover"
                      />
                    </Suspense>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <h4 className="text-white font-semibold text-lg mb-1">{homepageVideos[0].title}</h4>
                      <p className="text-white/80 text-sm">{homepageVideos[0].description}</p>
                    </div>
                  </div>
                  {/* CTA button between videos */}
                  <div className="w-full flex justify-center py-8 bg-transparent">
                    <button
                      onClick={() => onNavigate('aivideo')}
                      className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xl"
                    >
                      <span>أنشئ الفيديو الخاص بك</span>
                    </button>
                  </div>
                  {/* Second Vimeo video */}
                  <div className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900" style={{ aspectRatio: '9/16' }}>
                    <Suspense fallback={<div className="w-full h-full bg-black flex items-center justify-center">Loading…</div>}>
                      <VimeoEmbed
                        url={homepageVideos[1].url}
                        title={homepageVideos[1].title}
                        className="w-full h-full object-cover"
                      />
                    </Suspense>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                      <h4 className="text-white font-semibold text-lg mb-1">{homepageVideos[1].title}</h4>
                      <p className="text-white/80 text-sm">{homepageVideos[1].description}</p>
                    </div>
                  </div>
            {/* CTA button at end of homepage */}
            <div className="w-full flex justify-center py-10 bg-transparent">
              <button
                onClick={() => onNavigate('aivideo')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xl"
              >
                <span>أنشئ الفيديو الخاص بك</span>
              </button>
            </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };
