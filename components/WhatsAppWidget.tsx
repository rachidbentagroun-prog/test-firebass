import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({ 
  phoneNumber = '2120630961392',
  message = 'Hello! I would like to know more about your services.',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const handleWhatsAppClick = () => {
    const finalMessage = customMessage.trim() || message;
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setCustomMessage('');
  };

  const positionClasses = position === 'bottom-left' 
    ? 'bottom-5 left-5 sm:bottom-6 sm:left-6' 
    : 'bottom-5 right-5 sm:bottom-6 sm:right-6';

  return (
    <>
      {/* WhatsApp Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses} z-[9998] group transition-all duration-300 transform hover:scale-110 active:scale-95`}
        title="Chat on WhatsApp"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-75 scale-100 group-hover:scale-110 transition-transform pointer-events-none" />
          
          {/* Main Button */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-green-500/50 transition-shadow">
            {isOpen ? (
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300 rotate-90" />
            ) : (
              <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300" />
            )}
          </div>

          {/* Floating Label */}
          {!isOpen && (
            <div className="absolute right-16 sm:right-20 bg-gray-900 border border-white/10 rounded-lg px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Chat with us on WhatsApp
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-l-6 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
            </div>
          )}
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className={`fixed ${positionClasses} z-[9999] mb-20 sm:mb-24 animate-fade-in`}>
          <div className="w-80 sm:w-96 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">ImaginAI Support</h3>
                  <p className="text-green-100 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                    Active now
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-dark-950 min-h-[200px] flex flex-col justify-between">
              {/* Welcome Message */}
              <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-black">AI</span>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      👋 Hello! Welcome to ImaginAI. How can we help you today? Feel free to ask about our AI image and video generation services.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-green-500/50 outline-none resize-none"
                  maxLength={1000}
                />
                
                {/* Character Count */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500">
                    {customMessage.length}/1000
                  </p>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleWhatsAppClick}
                    disabled={!customMessage.trim() && message.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>

                {/* Quick Templates */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-black">Quick Messages:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCustomMessage('I want to generate AI images')}
                      className="text-[11px] px-2 py-1.5 bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-500/50 rounded text-gray-300 hover:text-white transition-all text-left"
                    >
                      📸 AI Images
                    </button>
                    <button
                      onClick={() => setCustomMessage('I want to generate AI videos')}
                      className="text-[11px] px-2 py-1.5 bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/50 rounded text-gray-300 hover:text-white transition-all text-left"
                    >
                      🎬 AI Videos
                    </button>
                    <button
                      onClick={() => setCustomMessage('What are your pricing plans?')}
                      className="text-[11px] px-2 py-1.5 bg-white/5 hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/50 rounded text-gray-300 hover:text-white transition-all text-left"
                    >
                      💰 Pricing
                    </button>
                    <button
                      onClick={() => setCustomMessage('Tell me more about your services')}
                      className="text-[11px] px-2 py-1.5 bg-white/5 hover:bg-cyan-600/30 border border-white/10 hover:border-cyan-500/50 rounded text-gray-300 hover:text-white transition-all text-left"
                    >
                      ℹ️ Services
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="bg-black/40 border-t border-white/10 px-4 py-3 text-center">
              <p className="text-[10px] text-gray-500">
                ✓ Messages sent via WhatsApp Web
              </p>
              <p className="text-[9px] text-gray-600 mt-1">
                Powered by WhatsApp Business
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized notification badge */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-5 sm:right-6 z-[9997] animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="bg-green-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-lg">
            Need Help?
          </div>
        </div>
      )}
    </>
  );
};
