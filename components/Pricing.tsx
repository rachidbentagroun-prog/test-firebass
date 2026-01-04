
import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { Plan } from '../types';

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
  plans: Plan[];
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan, plans }) => {
  const handlePlanClick = (plan: Plan) => {
    // Pass the plan to the parent to decide whether to open Auth, Upgrade, or External Link
    onSelectPlan(plan);
  };

  return (
    <div id="pricing-section" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-[#f5f7fb] to-white relative scroll-mt-16">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] w-[240px] h-[240px] rounded-full bg-[#1f4b99]/10 blur-3xl" />
        <div className="absolute bottom-[6%] right-[10%] w-[260px] h-[260px] rounded-full bg-[#47526a]/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3 sm:mb-4">Pricing Plans</h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">Choose the perfect plan for your creative needs. All plans include access to Dall-E 3, Sora2, and ChatGPT.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 bg-white shadow-[0_22px_70px_rgba(16,45,85,0.10)] hover:shadow-[0_26px_90px_rgba(16,45,85,0.14)] ${
                plan.recommended 
                  ? 'border-[#1f4b99]/50 ring-4 ring-[#1f4b99]/8'
                  : 'border-slate-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1f4b99] to-[#153a7a] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
                  Popular
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">{plan.price}</span>
                <span className="text-sm sm:text-base text-slate-500">/month</span>
              </div>

              <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-[#eef1f6] border border-slate-200">
                <span className="block text-xs sm:text-sm text-slate-600 mb-1">Monthly Credits</span>
                <span className="text-xl sm:text-2xl font-black text-[#1f4b99]">{plan.credits}</span>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700">
                    <div className={`p-1 rounded-full ${plan.recommended ? 'bg-[#1f4b99]/12 text-[#1f4b99]' : 'bg-slate-100 text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-2 sm:py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] ${
                  plan.recommended
                    ? 'btn-steel'
                    : 'btn-steel btn-steel--ghost'
                }`}
              >
                {plan.price === '$0' ? 'Start Free Trial' : plan.price === '$1' ? 'Try for $1' : 'Upgrade Plan'}
                {plan.buttonUrl && <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
