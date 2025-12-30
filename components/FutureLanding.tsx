import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Sparkles, Video, ImageIcon, Mic2, Zap, Star, 
  CheckCircle, Play, Upload, Wand2, Settings, Download,
  TrendingUp, Shield, Clock, Users, Quote, ChevronRight
} from 'lucide-react';
import { Pricing } from './Pricing';
import { Plan } from '../types';

interface FutureLandingProps {
  onGetStarted: () => void;
  onNavigate: (page: string) => void;
  isRegistered: boolean;
  onSelectPlan?: (plan: Plan) => void;
  plans?: Plan[];
}

export const FutureLanding: React.FC<FutureLandingProps> = ({ 
  onGetStarted, 
  onNavigate,
  isRegistered,
  onSelectPlan,
  plans = []
}) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // AI Video Examples (VEO & SORA)
  const videoExamples = [
    {
      title: "Cinematic Drone Shot",
      engine: "Sora 2",
      thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      description: "Sweeping aerial view of futuristic city at golden hour"
    },
    {
      title: "Product Showcase",
      engine: "Google Veo",
      thumbnail: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80",
      description: "Professional product reveal with dynamic lighting"
    },
    {
      title: "Nature Documentary",
      engine: "Sora 2",
      thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
      description: "Wildlife in 4K with cinematic motion blur"
    },
    {
      title: "Urban Timelapse",
      engine: "Google Veo",
      thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      description: "City lights transition from day to night"
    }
  ];

  // AI Image Examples (Midjourney, Gemini, ChatGPT)
  const imageExamples = [
    {
      title: "Cyberpunk Portrait",
      engine: "Midjourney",
      url: "https://images.unsplash.com/photo-1635002961193-89e745965524?w=800&q=80",
      style: "Photorealistic"
    },
    {
      title: "Abstract Art",
      engine: "Gemini 2.5",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      style: "Digital Art"
    },
    {
      title: "Fantasy Landscape",
      engine: "ChatGPT DALL-E",
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
      style: "Concept Art"
    },
    {
      title: "Product Design",
      engine: "Gemini 2.5",
      url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      style: "3D Render"
    },
    {
      title: "Architectural Vision",
      engine: "Midjourney",
      url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&q=80",
      style: "Hyperrealistic"
    },
    {
      title: "Character Design",
      engine: "ChatGPT DALL-E",
      url: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&q=80",
      style: "Illustration"
    }
  ];

  // AI Voice Examples (ElevenLabs)
  const voiceExamples = [
    {
      name: "Marcus - Professional Narrator",
      description: "Deep, authoritative voice perfect for documentaries",
      engine: "ElevenLabs",
      useCase: "Corporate Videos"
    },
    {
      name: "Sophia - Energetic Host",
      description: "Vibrant and engaging for entertainment content",
      engine: "ElevenLabs",
      useCase: "YouTube Content"
    },
    {
      name: "James - Warm Storyteller",
      description: "Friendly and conversational for audiobooks",
      engine: "ElevenLabs",
      useCase: "Audiobooks"
    },
    {
      name: "Luna - Calm Meditation Guide",
      description: "Soothing voice for wellness content",
      engine: "ElevenLabs",
      useCase: "Meditation Apps"
    }
  ];

  // Why Choose IMAGIN AI reasons
  const reasons = [
    {
      icon: Zap,
      title: "Lightning Fast Generation",
      description: "Create professional videos in seconds, not hours. Our AI processes your ideas instantly."
    },
    {
      icon: Star,
      title: "Multiple AI Engines",
      description: "Access Sora 2, Google Veo, Gemini, and more - all in one platform."
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Quality",
      description: "4K resolution, cinematic motion, and professional-grade output every time."
    },
    {
      icon: TrendingUp,
      title: "No Learning Curve",
      description: "Simple text prompts create complex videos. No video editing experience needed."
    },
    {
      icon: Users,
      title: "Trusted by 50,000+ Creators",
      description: "Join content creators, marketers, and businesses worldwide."
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Generate content anytime, anywhere. Your AI studio never sleeps."
    }
  ];

  // How to use steps
  const howToSteps = [
    {
      step: "1",
      title: "Write Your Prompt",
      description: "Describe your vision in natural language",
      gif: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&q=80"
    },
    {
      step: "2",
      title: "Select AI Engine",
      description: "Choose between Sora 2, Google Veo, or KlingAI",
      gif: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
    },
    {
      step: "3",
      title: "Customize Settings",
      description: "Adjust resolution, aspect ratio, and duration",
      gif: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
      step: "4",
      title: "Generate & Download",
      description: "Watch AI create your video and download in HD",
      gif: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Creator",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
      rating: 5,
      text: "IMAGIN AI completely transformed my workflow. What used to take days now takes minutes. The quality is absolutely stunning!"
    },
    {
      name: "Marcus Rodriguez",
      role: "Marketing Director",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
      rating: 5,
      text: "We've saved thousands on video production. The AI-generated videos are indistinguishable from professionally shot footage."
    },
    {
      name: "Emily Watson",
      role: "YouTuber",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
      rating: 5,
      text: "The text-to-video feature is mind-blowing. I can create B-roll footage for my videos in seconds. Game changer!"
    },
    {
      name: "David Park",
      role: "Indie Filmmaker",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
      rating: 5,
      text: "As an independent filmmaker, this tool is incredible. The cinematic quality rivals expensive production equipment."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="bg-dark-950">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-8 uppercase italic">
            The Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              AI Creation
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Transform text into cinematic videos, stunning images, and professional voiceovers. 
            All powered by the world's most advanced AI engines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
              onClick={() => isRegistered ? onNavigate('video-generator') : onGetStarted()}
              className="group px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105 flex items-center gap-3"
            >
              Start Creating Free <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate('explore')}
              className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <Play className="w-5 h-5" /> Watch Examples
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-white mb-2">50K+</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">2M+</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Videos Generated</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">4.9★</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Video Examples Section */}
      <section className="py-24 bg-dark-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">AI Video Generation</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Powered by Sora 2 & Google Veo
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Create cinematic videos from simple text descriptions. Professional quality, zero experience needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoExamples.map((video, idx) => (
              <div key={idx} className="group relative bg-dark-900 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black uppercase rounded-full">
                      {video.engine}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-white font-black text-lg mb-2">{video.title}</h4>
                  <p className="text-gray-400 text-sm">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Image Examples Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-purple-400 uppercase tracking-[0.4em] mb-4">AI Image Synthesis</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Midjourney • Gemini • DALL-E Quality
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Generate stunning 4K images in any style. From photorealistic to abstract art.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {imageExamples.map((image, idx) => (
              <div key={idx} className="group relative aspect-square bg-dark-900 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
                <img 
                  src={image.url} 
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-xs font-black text-purple-400 uppercase mb-1">{image.engine}</div>
                    <div className="text-white font-bold text-sm">{image.title}</div>
                    <div className="text-gray-400 text-xs">{image.style}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Voice Examples Section */}
      <section className="py-24 bg-dark-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-pink-400 uppercase tracking-[0.4em] mb-4">AI Voice Synthesis</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Studio Quality with ElevenLabs
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Transform text into natural, expressive speech. Perfect for videos, audiobooks, and more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {voiceExamples.map((voice, idx) => (
              <div key={idx} className="bg-dark-900 border border-white/10 rounded-3xl p-8 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20">
                  <Mic2 className="w-8 h-8 text-pink-400" />
                </div>
                <h4 className="text-white font-black text-xl mb-2">{voice.name}</h4>
                <p className="text-gray-400 text-sm mb-4">{voice.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 uppercase">{voice.useCase}</span>
                  <button className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-500 transition-colors">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose IMAGIN AI Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">The IMAGIN AI Advantage</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Why Choose IMAGIN AI Video Generator?
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The most powerful, easiest-to-use AI content creation platform on the market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reasons.map((reason, idx) => (
              <div key={idx} className="bg-dark-900 border border-white/10 rounded-3xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <reason.icon className="w-8 h-8 text-indigo-400" />
                </div>
                <h4 className="text-white font-black text-xl mb-3">{reason.title}</h4>
                <p className="text-gray-400 leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-24 bg-dark-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Simple Process</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Easily Turn Images into Videos with Free AI Image to Video Generator
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Four simple steps to create professional videos. No technical skills required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howToSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-dark-900 border border-white/10 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2 group">
                  <div className="aspect-video relative overflow-hidden bg-dark-950">
                    <img 
                      src={step.gif} 
                      alt={step.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl">
                        {step.step}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-white font-black text-xl mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                </div>
                {idx < howToSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-indigo-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button 
              onClick={() => isRegistered ? onNavigate('video-lab-landing') : onGetStarted()}
              className="px-8 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-3"
            >
              Try Text To Video Now <Wand2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">User Reviews</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6">
              Loved by Creators Worldwide
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of satisfied creators transforming their content with AI.
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden">
              <div className="absolute top-8 left-8 opacity-10">
                <Quote className="w-24 h-24 text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={testimonials[currentTestimonial].avatar} 
                    alt={testimonials[currentTestimonial].name}
                    className="w-16 h-16 rounded-full border-2 border-indigo-500"
                  />
                  <div>
                    <h4 className="text-white font-black text-xl">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-gray-400 text-sm">{testimonials[currentTestimonial].role}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-white text-xl font-medium leading-relaxed italic">
                  "{testimonials[currentTestimonial].text}"
                </p>
              </div>
            </div>
          </div>

          {/* All Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-dark-900 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-bold text-sm">{testimonial.name}</div>
                    <div className="text-gray-400 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10 blur-3xl" />
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase italic mb-6">
            Ready to Create?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join 50,000+ creators using IMAGIN AI. Start with 3 free generations.
          </p>
          <button 
            onClick={() => isRegistered ? onNavigate('video-generator') : onGetStarted()}
            className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xl uppercase tracking-wider shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-3"
          >
            Start Creating Free <Sparkles className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      {plans.length > 0 && onSelectPlan && (
        <Pricing 
          onSelectPlan={onSelectPlan} 
          plans={plans} 
        />
      )}
    </div>
  );
};
