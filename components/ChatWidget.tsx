
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User as UserIcon, Sparkles, RefreshCw } from 'lucide-react';
import { ChatMessage, User, SupportSession } from '../types';
import { sendSupportChatMessage, createSupportSession, getChatHistory, notifyAdminOfSupportRequest } from '../services/dbService';

interface ChatWidgetProps {
  user: User | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  hideLauncher?: boolean; // when true, suppress floating launcher button; open via external control
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ user, isOpen, setIsOpen, hideLauncher = false }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('imaginai_chat_session'));
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId && isOpen) {
      loadHistory();
    }
  }, [sessionId, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen]);

  const loadHistory = async () => {
    if (!sessionId) return;
    try {
      const logs = await getChatHistory(sessionId);
      setHistory(logs);
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    let currentSessionId = sessionId;
    let isFirstMessage = !sessionId;
    setIsLoading(true);

    try {
      let activeSession: SupportSession | undefined;

      if (!currentSessionId) {
        activeSession = await createSupportSession(
          user?.name || 'Guest User',
          user?.email || undefined,
          user?.id || undefined
        );
        currentSessionId = activeSession.id;
        setSessionId(currentSessionId);
        localStorage.setItem('imaginai_chat_session', currentSessionId);
      }

      await sendSupportChatMessage(currentSessionId, message, 'user');
      
      // Trigger Admin Notification (Email + System Alert)
      if (activeSession) {
         notifyAdminOfSupportRequest(activeSession, message, true);
      } else if (currentSessionId) {
         // Minimal session object for non-first messages
         notifyAdminOfSupportRequest({
           id: currentSessionId,
           name: user?.name || 'User',
           email: user?.email,
           isGuest: !user,
           chatHistory: [],
           lastMessageAt: Date.now()
         }, message, false);
      }

      setMessage('');
      loadHistory();
    } catch (e) {
      console.error("Message transmission failure", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[300]">
      {!isOpen && hideLauncher ? null : !isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 h-[500px] bg-dark-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-bounce-in">
          {/* Header */}
          <div className="p-5 bg-indigo-600 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tighter">Support Core</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-indigo-100 uppercase">Always Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-black/20">
            {history.length === 0 && !isLoading && (
              <div className="text-center py-10 opacity-30">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Initialize signal buffer...</p>
                <p className="text-[8px] mt-2 font-black text-gray-600">Admin will respond to your node shortly.</p>
              </div>
            )}
            {history.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium shadow-lg leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-dark-800 text-gray-300 border border-white/5 rounded-tl-none'
                }`}>
                  {msg.text}
                  <div className={`text-[8px] mt-2 opacity-50 font-bold uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-indigo-600/20 p-3 rounded-2xl rounded-tr-none animate-pulse">
                   <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-dark-900">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                placeholder="Type your message..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-700 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-indigo-500 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
