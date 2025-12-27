import React from 'react';
import { 
  ArrowLeft, Zap, TrendingUp, Gift, Sparkles, Crown, 
  CheckCircle, AlertCircle, Clock, Flame, Award, Target
} from 'lucide-react';
import { User } from '../types';

interface CreditPageProps {
  user: User;
  onBack: () => void;
  onUpgrade: () => void;
}

export const CreditPage: React.FC<CreditPageProps> = ({ user, onBack, onUpgrade }) => {
  const isPremium = user.plan === 'premium';
  const creditsRemaining = isPremium ? 'Unlimited' : user.credits;
  const creditsPercentage = isPremium ? 100 : Math.min((user.credits / 16) * 100, 100); // Assuming 16 credits for basic plan

  const creditCosts = [
    { feature: 'AI Image Generation', cost: '1 Credit', icon: Sparkles },
    { feature: 'AI Voice & Audio (30s)', cost: '1 Credit', icon: Zap },
    { feature: 'AI Video Generation', cost: '2 Credits', icon: TrendingUp },
  ];

  const planFeatures = {
    free: {
      name: 'Free Tier',
      credits: 'Limited',
      features: [
        'Basic AI Image Generator',
        'Community Gallery Access',
        'Standard Processing Speed'
      ],
      color: 'gray'
    },
    basic: {
      name: 'Basic Creator',
      credits: '16 Credits/month',
      features: [
        '16 Generations per month',
        'Access to AI Image Generator',
        'Access to AI Voice & Audio',
        'Access to AI Video Generator',
        'Private Gallery Storage',
        'Standard Processing Speed',
        'Email Support'
      ],
      color: 'indigo',
      price: '$9.9/month'
    },
    premium: {
      name: 'Premium Creator',
      credits: 'Unlimited',
      features: [
        'Unlimited Generations',
        'Priority Processing Speed',
        'Early Access to New Features',
        'Advanced AI Models',
        'Extended Video Length',
        'HD Audio Quality',
        'Priority Support',
        'API Access (Coming Soon)'
      ],
      color: 'purple',
      price: '$20/month'
    }
  };

  const currentPlan = planFeatures[user.plan as keyof typeof planFeatures] || planFeatures.free;

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-12"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium uppercase tracking-widest text-[10px] font-black">Back</span>
        </button>

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Credits & Billing</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4 uppercase italic tracking-tighter">
            Your Credits
          </h1>
          <p className="text-xl text-gray-400 font-medium">Manage your account credits and explore upgrade options</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Credits Balance Card */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">CREDITS REMAINING</p>
                  <h2 className="text-5xl font-black text-white">
                    {creditsRemaining}
                  </h2>
                </div>
                <div className="p-4 bg-indigo-500/20 rounded-full">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              {!isPremium && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Usage</span>
                    <span className="text-xs font-black text-indigo-400">{Math.round(creditsPercentage)}%</span>
                  </div>
                  <div className="w-full h-3 bg-dark-900 rounded-full overflow-hidden border border-indigo-500/30">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${creditsPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {isPremium ? 'Unlimited generation access' : `${user.credits} of 16 credits used this month`}
                  </p>
                </div>
              )}

              <div className="bg-dark-900/50 rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Current Plan
                </h3>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-white">{currentPlan.name}</p>
                  <p className="text-indigo-400 font-semibold">{currentPlan.credits}</p>
                  {'price' in currentPlan && (
                    <p className="text-gray-400 text-sm">{(currentPlan as any).price}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-dark-900/50 border border-white/5 rounded-xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-lg">
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Reset Date</p>
              </div>
              <p className="text-lg font-black text-white">Monthly</p>
              <p className="text-xs text-gray-500 mt-1">Resets on the 1st of each month</p>
            </div>

            <div className="bg-dark-900/50 border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-500/20 rounded-lg">
                  <Flame className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Status</p>
              </div>
              <p className="text-lg font-black text-white capitalize">{user.plan}</p>
              <p className="text-xs text-gray-500 mt-1">{isPremium ? 'Priority access' : 'Standard access'}</p>
            </div>

            {!isPremium && (
              <button
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-6 rounded-xl uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Crown className="w-4 h-4" />
                Upgrade Now
              </button>
            )}
          </div>
        </div>

        {/* Credit Costs */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">How Credits Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditCosts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-dark-900/50 border border-white/5 rounded-xl p-6 hover:border-indigo-500/30 transition-colors group">
                  <div className="p-3 bg-indigo-500/20 rounded-lg w-fit mb-4 group-hover:bg-indigo-500/30 transition-colors">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">{item.feature}</p>
                  <p className="text-indigo-400 font-black text-lg">{item.cost}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <div className={`border rounded-2xl p-8 transition-all ${
              user.plan === 'basic' 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-white/10 bg-dark-900/50 hover:border-indigo-500/50'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Basic Creator</h3>
                  <p className="text-indigo-400 font-semibold">$9.9/month</p>
                </div>
                {user.plan === 'basic' && (
                  <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-widest">Current</div>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-6">Perfect for getting started with AI creation</p>
              <div className="space-y-3 mb-6">
                {planFeatures.basic.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              {user.plan !== 'basic' && (
                <a 
                  href="https://bentagroun.gumroad.com/l/huodf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-6 rounded-lg uppercase tracking-widest text-sm transition-colors flex items-center justify-center"
                >
                  Get Basic Plan
                </a>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`border rounded-2xl p-8 transition-all relative overflow-hidden ${
              user.plan === 'premium' 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-white/10 bg-dark-900/50 hover:border-purple-500/50'
            }`}>
              <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase tracking-widest">
                Most Popular
              </div>
              <div className="flex items-start justify-between mb-6 mt-4">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Premium Creator</h3>
                  <p className="text-purple-400 font-semibold">$20/month</p>
                </div>
                {user.plan === 'premium' && (
                  <div className="px-3 py-1 bg-purple-600 text-white text-xs font-black rounded-full uppercase tracking-widest">Current</div>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-6">Unlimited power for professional creators</p>
              <div className="space-y-3 mb-6">
                {planFeatures.premium.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              {user.plan !== 'premium' && (
                <a 
                  href="https://bentagroun.gumroad.com/l/zrgraz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-3 px-6 rounded-lg uppercase tracking-widest text-sm transition-all flex items-center justify-center shadow-lg shadow-purple-600/30"
                >
                  Upgrade to Premium
                </a>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-dark-900/50 border border-white/5 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                Do credits roll over?
              </h3>
              <p className="text-gray-400 text-sm">No, credits reset every month on the 1st. Unused credits from the previous month are not carried over.</p>
            </div>
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                Can I pause my subscription?
              </h3>
              <p className="text-gray-400 text-sm">Yes! You can pause or cancel your subscription anytime from your billing dashboard. Unused credits won't be refunded.</p>
            </div>
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                What happens if I run out of credits?
              </h3>
              <p className="text-gray-400 text-sm">You can still use the free AI image generator. Upgrade to continue using video and voice features.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
