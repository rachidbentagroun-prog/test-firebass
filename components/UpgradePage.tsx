import React from 'react';
import { 
  Zap, Check, ArrowLeft, Sparkles, Crown, Rocket, 
  Star, Shield, TrendingUp, ExternalLink, Gift, Award
} from 'lucide-react';

interface UpgradePageProps {
  onBack: () => void;
  onContactUs?: () => void;
}

export const UpgradePage: React.FC<UpgradePageProps> = ({ onBack, onContactUs }) => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic Creator',
      price: '$9.9',
      period: '/month',
      description: 'Perfect for getting started with AI creation',
      features: [
        '100 Generations per month',
        'Access to AI Image Generator',
        'Access to AI Voice & Audio',
        'Access to AI Video Generator',
        'Private Gallery Storage',
        'Standard Processing Speed',
        'Email Support',
        'Commercial License'
      ],
      url: 'https://bentagroun.gumroad.com/l/huodf',
      recommended: true,
      color: 'indigo',
      icon: Rocket
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$20',
      period: '/month',
      description: 'Unlimited power for professional creators',
      features: [
        '250 Generations per month',
        'Priority Processing Speed',
        'Early Access to New Features',
        'Advanced AI Models',
        'Extended Video Length',
        'HD Audio Quality',
        'Priority Support',
        'Commercial License',
        'API Access (Coming Soon)',
        'Team Collaboration (Coming Soon)'
      ],
      url: 'https://bentagroun.gumroad.com/l/zrgraz',
      recommended: false,
      color: 'purple',
      icon: Crown
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-8"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium uppercase tracking-widest text-[10px] font-black">Back to Profile</span>
        </button>

        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Premium Access</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 uppercase italic tracking-tighter leading-none">
            UNLOCK YOUR
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CREATIVE POWER
            </span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto">
            Choose the perfect plan to supercharge your AI creation workflow and bring your ideas to life
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div 
                key={plan.id}
                className={`relative bg-dark-900 border rounded-[3rem] p-10 transition-all duration-300 hover:scale-[1.02] ${
                  plan.recommended 
                    ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/20' 
                    : 'border-white/10 hover:border-purple-500/30'
                }`}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full border-4 border-dark-900">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-white fill-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-${plan.color}-500/20 to-${plan.color}-600/20 mb-4`}>
                    <Icon className={`w-8 h-8 text-${plan.color}-400`} />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                    <span className="text-gray-500 text-sm font-bold">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-lg bg-${plan.color}-500/20 flex items-center justify-center mt-0.5`}>
                        <Check className={`w-3 h-3 text-${plan.color}-400`} />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <a
                  href={plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all text-center ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Get Started Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Features Banner */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 border border-white/10 rounded-[2.5rem] p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 mb-3">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Secure Payment</h4>
                <p className="text-xs text-gray-500 font-medium">Powered by Gumroad</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mb-3">
                  <Gift className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Cancel Anytime</h4>
                <p className="text-xs text-gray-500 font-medium">No long-term commitment</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-500/20 mb-3">
                  <Award className="w-6 h-6 text-pink-400" />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Instant Access</h4>
                <p className="text-xs text-gray-500 font-medium">Start creating immediately</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ or Trust Section */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500 font-medium">
            All plans include commercial licensing. Need a custom enterprise solution?{' '}
            <button
              onClick={() => onContactUs?.()}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline"
            >
              Contact us
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};
