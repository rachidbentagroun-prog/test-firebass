
import React, { useEffect, useRef } from 'react';
import { Check, ExternalLink, Sparkles, Zap, Crown, Rocket } from 'lucide-react';
import { Plan } from '../types';

interface PricingLandingProps {
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}

export const PricingLanding: React.FC<PricingLandingProps> = ({ plans, onSelectPlan }) => {
  const plansContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plansContainerRef.current) {
      plansContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handlePlanClick = (plan: Plan) => {
    // Create WhatsApp message based on plan
    const messages: Record<string, string> = {
      free: "Hello! I'm interested in your Free plan and want to start my free trial.",
      test: "Hello! I'm interested in your $1 Test plan and would like more details.",
      basic: "Hello! I'm interested in your Basic plan and want to upgrade my account.",
      premium: "Hello! I'm interested in your Premium plan with unlimited credits. Can you provide more details?"
    };
    
    const message = messages[plan.id] || `Hello! I'm interested in your ${plan.name} plan and want more details.`;
    const whatsappUrl = `https://wa.me/212630961392?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const getPlanIcon = (planId: string) => {
    switch(planId) {
      case 'free': return <Sparkles className="w-6 h-6" />;
      case 'test': return <Zap className="w-6 h-6" />;
      case 'basic': return <Rocket className="w-6 h-6" />;
      case 'premium': return <Crown className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f5f7fb] to-white">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute top-[15%] left-[5%] w-[300px] h-[300px] rounded-full bg-[#1f4b99]/10 blur-3xl" />
        <div className="absolute top-[40%] right-[8%] w-[350px] h-[350px] rounded-full bg-[#47526a]/10 blur-3xl" />
        <div className="absolute bottom-[10%] left-[15%] w-[280px] h-[280px] rounded-full bg-[#1f4b99]/8 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-32 relative">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f4b99]/10 border border-[#1f4b99]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#1f4b99]" />
            <span className="text-xs sm:text-sm font-bold text-[#1f4b99] uppercase tracking-wide">Pricing Plans</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 sm:mb-6">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Get started for free or unlock unlimited creativity with our premium plans. 
            All plans include access to <span className="font-bold text-[#1f4b99]">Dall-E 3</span>, 
            <span className="font-bold text-[#1f4b99]"> Sora2</span>, and 
            <span className="font-bold text-[#1f4b99]"> ChatGPT</span>.
          </p>

          {/* Features highlight */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-1.5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>1080P HD Output</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-1.5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>No Watermarks</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-1.5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>Instant Generation</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-1.5 rounded-full bg-green-100">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>No Queues</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div ref={plansContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl p-6 sm:p-8 border transition-all duration-300 hover:-translate-y-2 bg-white shadow-[0_22px_70px_rgba(16,45,85,0.10)] hover:shadow-[0_26px_90px_rgba(16,45,85,0.14)] ${
                plan.recommended 
                  ? 'border-[#1f4b99] ring-4 ring-[#1f4b99]/10 scale-105 lg:scale-110'
                  : 'border-slate-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1f4b99] to-[#153a7a] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <div className="flex flex-col h-full">
                {/* Plan Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  plan.recommended 
                    ? 'bg-gradient-to-br from-[#1f4b99] to-[#153a7a] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {getPlanIcon(plan.id)}
                </div>

                {/* Plan Name & Price */}
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm sm:text-base text-slate-500">/month</span>
                </div>

                {/* Credits Badge */}
                <div className={`mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl border ${
                  plan.recommended
                    ? 'bg-[#1f4b99]/5 border-[#1f4b99]/20'
                    : 'bg-[#eef1f6] border-slate-200'
                }`}>
                  <span className="block text-xs sm:text-sm text-slate-600 mb-1">Monthly Credits</span>
                  <span className={`text-xl sm:text-2xl font-black ${
                    plan.recommended ? 'text-[#1f4b99]' : 'text-slate-900'
                  }`}>{plan.credits}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700">
                      <div className={`p-1 rounded-full flex-shrink-0 mt-0.5 ${
                        plan.recommended 
                          ? 'bg-[#1f4b99]/12 text-[#1f4b99]' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 sm:py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] cursor-pointer ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-[#1f4b99] to-[#153a7a] text-white shadow-lg shadow-[#1f4b99]/30 hover:shadow-xl hover:shadow-[#1f4b99]/40 hover:scale-105'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-[#1f4b99] hover:text-[#1f4b99] hover:bg-[#1f4b99]/5'
                  }`}
                >
                  {plan.price === '$0' ? 'Start Free Trial' : plan.price === '$1' ? 'Try for $1' : 'Get Started'}
                  {plan.buttonUrl && <ExternalLink className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 sm:mt-20 md:mt-24 text-center">
          <div className="inline-block p-8 rounded-2xl bg-white border border-slate-200 shadow-lg max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">Need Help Choosing?</h3>
            <p className="text-sm sm:text-base text-slate-600 mb-6">
              Not sure which plan is right for you? Start with our free trial to explore all features, 
              or contact our support team for personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => handlePlanClick(plans[0])}
                className="px-6 py-3 rounded-xl bg-[#1f4b99] text-white font-semibold hover:bg-[#153a7a] transition-colors cursor-pointer"
              >
                Start Free Trial
              </button>
              <button 
                className="px-6 py-3 rounded-xl bg-white text-slate-700 font-semibold border-2 border-slate-200 hover:border-[#1f4b99] hover:text-[#1f4b99] transition-colors cursor-pointer"
                onClick={() => window.open('https://wa.me/212630961392?text=' + encodeURIComponent('Hello! I need help choosing the right pricing plan for my needs.'), '_blank', 'noopener,noreferrer')}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
