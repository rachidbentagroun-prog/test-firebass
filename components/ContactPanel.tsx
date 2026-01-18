import React, { useState } from 'react';
import { MessageCircle, X, Phone, ChevronRight, MessageSquare } from 'lucide-react';

interface ContactPanelProps {
  onWhatsAppClick: () => void;
  isWhatsAppOpen?: boolean;
}

export const ContactPanel: React.FC<ContactPanelProps> = ({ 
  onWhatsAppClick,
  isWhatsAppOpen = false
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleWhatsAppClick = () => {
    onWhatsAppClick();
    setIsPanelOpen(false);
  };

  return (
    <>
      {/* Main Contact Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 group transition-all duration-300 transform hover:scale-110 active:scale-95"
        title="Contact Us"
      >
        <div className="relative flex items-center justify-center">
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full animate-pulse opacity-75 scale-100 group-hover:scale-110 transition-transform" />
          
          {/* Main Button */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-indigo-500/50">
            {isPanelOpen ? (
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300 rotate-90" />
            ) : (
              <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform duration-300" />
            )}
          </div>

          {/* Floating Badge - Shows number of options */}
          {/* WhatsApp Option Only */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full group relative overflow-hidden rounded-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:bg-green-600/5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-green-600/5 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-4 flex items-start gap-3 sm:gap-4">
              {/* Icon */}
              <div className="p-2.5 sm:p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors flex-shrink-0">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h4 className="text-white font-black text-sm uppercase tracking-tight">WhatsApp</h4>
                <p className="text-gray-400 text-xs mt-0.5">Quick response • Direct chat</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-green-400 text-[10px] font-black uppercase">Available now</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors flex-shrink-0" />
            </div>
          </button>
                <div className="relative p-4 flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className="p-2.5 sm:p-3 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors flex-shrink-0">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">Support Chat</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Direct to admin • Real-time</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-indigo-400 text-[10px] font-black uppercase">Online</span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                </div>
              </button>
            </div>

            {/* Footer Info */}
            <div className="bg-black/40 border-t border-white/10 px-4 py-3 text-center">
              <p className="text-[10px] text-gray-500">
                ✓ WhatsApp or Support Chat, 24/7
              </p>
              <p className="text-[9px] text-gray-600 mt-1">
                Admin responds within minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Badge - when panel is closed */}
      {!isPanelOpen && (
        <div className="fixed bottom-24 right-6 sm:bottom-28 sm:right-8 z-30 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="bg-gradient-to-r from-indigo-500 to-green-500 text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Need Help?
          </div>
        </div>
      )}
    </>
  );
};
