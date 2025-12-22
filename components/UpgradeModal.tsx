
import React from 'react';
import { X, Zap, Check, ExternalLink } from 'lucide-react';
import { Plan } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
}

const UPGRADE_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic Creator',
    price: '$9.9',
    credits: 50,
    features: [
      '50 Generations / mo',
      'Faster Generation',
      'Private Gallery',
      'Commercial License'
    ],
    recommended: true,
    buttonUrl: 'https://bentagroun.gumroad.com/l/huodf'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$20',
    credits: 200,
    features: [
      '200 Generations / mo',
      'Video Suite Access',
      'Priority Support',
      'Image Editing Tools'
    ],
    buttonUrl: 'https://bentagroun.gumroad.com/l/zrgraz'
  }
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSelectPlan }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-dark-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upgrade Your Experience</h2>
              <p className="text-indigo-200 text-sm">Choose a plan to unlock the full power of neural synthesis.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {UPGRADE_PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative rounded-xl p-6 border transition-all duration-300 ${
                  plan.recommended 
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-xl shadow-indigo-500/10' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">/mo</span>
                  </div>
                  <div className="mt-2 text-indigo-300 font-medium text-sm">
                    {plan.credits} Credits
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className={`p-0.5 rounded-full ${plan.recommended ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.recommended
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white text-dark-950 hover:bg-gray-100'
                  }`}
                >
                  Subscribe Now
                  {plan.buttonUrl && <ExternalLink className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-6">
            Secure checkout powered by Gumroad & Stripe.
          </p>
        </div>
      </div>
    </div>
  );
};
