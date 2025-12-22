import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Plan } from '../types';

interface StripeCheckoutProps {
  plan: Plan;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({ plan, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setIsProcessing(true);

    // Simulate payment network delay
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white text-gray-900 flex flex-col md:flex-row overflow-hidden font-sans animate-fade-in">
      
      {/* Left Column: Order Summary */}
      <div className="w-full md:w-1/2 lg:w-[45%] bg-[#f7f9fc] border-r border-gray-200 p-8 md:p-12 flex flex-col relative overflow-y-auto">
        <button 
          onClick={onCancel}
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mt-12 mb-8">
          <div className="flex items-center gap-2 text-gray-500 mb-6">
            <div className="flex items-center gap-1 font-bold text-gray-900">
              <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white text-xs">I</span>
              </div>
              ImaginAI Inc.
            </div>
          </div>
          
          <div className="mb-2 text-gray-500 text-sm font-medium uppercase tracking-wide">Subscribe to</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
            <span className="text-gray-500 font-medium">/ per month</span>
          </div>
        </div>

        <div className="space-y-4 mb-auto">
           {plan.features.map((feature, i) => (
             <div key={i} className="flex items-start gap-3">
               <div className="bg-green-100 p-1 rounded-full mt-0.5">
                 <CheckCircle2 className="w-3 h-3 text-green-600" />
               </div>
               <span className="text-gray-600 text-sm font-medium">{feature}</span>
             </div>
           ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
           <div className="flex justify-between items-center text-sm mb-2">
             <span className="text-gray-500">Subtotal</span>
             <span className="font-medium">{plan.price}</span>
           </div>
           <div className="flex justify-between items-center text-sm mb-4">
             <span className="text-gray-500">Tax</span>
             <span className="font-medium">$0.00</span>
           </div>
           <div className="flex justify-between items-center text-lg font-bold">
             <span>Total due today</span>
             <span>{plan.price}</span>
           </div>
        </div>
      </div>

      {/* Right Column: Payment Form */}
      <div className="w-full md:w-1/2 lg:w-[55%] bg-white p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Pay with card</h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Email</label>
                  <input 
                    type="email" 
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Card Information</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                    <div className="relative">
                       <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                       <input 
                         type="text" 
                         placeholder="1234 5678 1234 5678"
                         className="w-full pl-10 pr-4 py-3 outline-none border-b border-gray-200"
                         required
                       />
                    </div>
                    <div className="flex bg-gray-50">
                      <input 
                        type="text" 
                        placeholder="MM / YY" 
                        className="w-1/2 px-4 py-3 outline-none border-r border-gray-200 bg-white"
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="CVC" 
                        className="w-1/2 px-4 py-3 outline-none bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Country or Region</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white">
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>France</option>
                    <option>Germany</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full mt-8 bg-[#635bff] text-white font-bold py-4 rounded-lg hover:bg-[#544dcc] transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing...' : `Pay ${plan.price}`}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                Payments are secure and encrypted
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#635bff] rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900">Processing payment...</h3>
              <p className="text-gray-500 text-sm mt-1">Please do not close this window.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 animate-scale-in">
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 className="w-10 h-10 text-green-600" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
               <p className="text-gray-500 text-center mb-8">
                 Your subscription to {plan.name} is now active.
               </p>
               <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 animate-[width_1.5s_ease-out_forwards]" style={{width: '100%'}}></div>
               </div>
               <p className="text-xs text-gray-400 mt-2">Redirecting you back...</p>
            </div>
          )}
          
          <div className="mt-8 border-t border-gray-100 pt-6 flex items-center justify-center gap-6 text-gray-400 grayscale opacity-60">
             <span className="font-bold flex items-center gap-1 text-sm"><ShieldCheck className="w-4 h-4"/> POWERED BY STRIPE</span>
          </div>

        </div>
      </div>
    </div>
  );
};