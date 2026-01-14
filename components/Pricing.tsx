
import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { Plan } from '../types';
import { useLanguage } from '../utils/i18n';

interface PricingProps {
  onSelectPlan: (plan: Plan) => void;
  plans: Plan[];
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan, plans }) => {
  const { t } = useLanguage();
  
  const handlePlanClick = (plan: Plan) => {
    // Pass the plan to the parent to decide whether to open Auth, Upgrade, or External Link
    onSelectPlan(plan);
  };

  // Helper function to get translated plan name
  const getPlanName = (planId: string) => {
    const translations: Record<string, string> = {
      'free': t('pricing.plans.free.name'),
      'test': t('pricing.plans.test.name'),
      'basic': t('pricing.plans.basic.name'),
      'premium': t('pricing.plans.premium.name')
    };
    return translations[planId] || planId;
  };

  // Helper function to get translated features
  const getPlanFeatures = (planId: string, defaultFeatures: string[]) => {
    const featureKeys: Record<string, string[]> = {
      'free': ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9'],
      'test': ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9', 'feature10'],
      'basic': ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9', 'feature10'],
      'premium': ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8', 'feature9', 'feature10']
    };

    const keys = featureKeys[planId];
    if (!keys) return defaultFeatures;

    return keys.map((key, idx) => {
      const translation = t(`pricing.plans.${planId}.${key}`);
      // If translation key doesn't exist, fall back to original feature
      return translation.includes('pricing.plans') ? (defaultFeatures[idx] || '') : translation;
    }).filter(Boolean);
  };

  return (
    <div id="pricing-section" className="bg-white scroll-mt-16">
      <div className="page-shell" style={{ paddingTop: '3rem', paddingBottom: '3.5rem' }}>
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <span className="pill-badge" style={{ marginBottom: '0.75rem' }}>{t('pricing.title')}</span>
          <h2 className="headline-xl" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{t('pricing.subtitle')}</h2>
          <p className="lead-text" style={{ maxWidth: '720px', margin: '0 auto' }}>{t('pricing.features')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {plans.map((plan) => {
            const translatedFeatures = getPlanFeatures(plan.id, plan.features);
            
            return (
              <div 
                key={plan.id}
                className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 bg-white shadow-sm hover:shadow-lg ${
                  plan.recommended 
                    ? 'border-[#3B5CCC]/50 ring-4 ring-[#3B5CCC]/10'
                    : 'border-slate-200'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3B5CCC] to-[#2F4FB5] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
                    {t('pricing.popular')}
                  </div>
                )}

                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">{getPlanName(plan.id)}</h3>
                <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-sm sm:text-base text-slate-500">/{t('pricing.month')}</span>
                </div>

                <div className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-[#F3F6FB] border border-slate-200">
                  <span className="block text-xs sm:text-sm text-slate-600 mb-1">{t('pricing.monthlyCredits')}</span>
                  <span className="text-xl sm:text-2xl font-black text-[#2F4FB5]">{plan.credits}</span>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {translatedFeatures.map((feature, idx) => (
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
                      ? 'primary-btn'
                      : 'ghost-btn'
                  }`}
                >
                  {plan.price === '$0' ? t('pricing.startFree') : plan.price === '$1' ? t('pricing.tryOne') : t('pricing.upgrade')}
                  {plan.buttonUrl && <ExternalLink className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
