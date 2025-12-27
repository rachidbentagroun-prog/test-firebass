
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
    <div id="pricing-section" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-dark-950 relative scroll-mt-16">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] bg-pink-600/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Choose Your Plan</h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">Flexible subscription options for every creator.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-2xl p-8 border transition-all duration-300 hover:transform hover:-translate-y-2 ${
                plan.recommended 
                  ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl shadow-indigo-900/20' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  POPULAR
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-sm sm:text-base text-gray-400">/month</span>
              </div>

              <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-black/20 border border-white/5">
                <span className="block text-xs sm:text-sm text-gray-400 mb-1">Monthly Credits</span>
                <span className="text-xl sm:text-2xl font-bold text-indigo-400">{plan.credits}</span>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300">
                    <div className={`p-1 rounded-full ${plan.recommended ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px] ${
                  plan.recommended
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-white text-dark-950 hover:bg-gray-100'
                }`}
              >
                {plan.price === '$0' ? 'Start Free Trial' : 'UPGRADE PLAN'}
                {plan.buttonUrl && <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
