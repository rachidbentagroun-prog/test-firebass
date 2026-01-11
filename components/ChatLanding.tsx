import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, User as UserIcon, Bot, Paperclip, Mic, Trash2 } from 'lucide-react';
import { User } from '../types';
import { updateUserCredits, saveGPTMessage, loadGPTChatHistory, clearGPTChatHistory } from '../services/dbService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatLandingProps {
  user: User | null;
  onStartChat: () => void;
  onLoginClick: () => void;
}

export const ChatLanding: React.FC<ChatLandingProps> = ({ user, onStartChat, onLoginClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [messageCount, setMessageCount] = useState(0); // Track total messages sent by user
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Count user messages
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  
  // Check if user is on free plan (no plan or 'free' plan)
  const isFreePlan = !user?.plan || user.plan === 'free';
  
  // Check if blocked
  const isBlocked = isFreePlan 
    ? userMessageCount >= 2  // Free plan: 2 messages only
    : (user?.credits || 0) <= 0; // Paid plan: no credits left

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history when user logs in
  useEffect(() => {
    if (user?.id) {
      loadChatHistory();
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user?.id) return;
    try {
      const history = await loadGPTChatHistory(user.id);
      setMessages(history);
      console.log('✅ Loaded chat history:', history.length, 'messages');
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  const clearHistory = async () => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    
    try {
      await clearGPTChatHistory(user.id);
      setMessages([]);
      console.log('✅ Chat history cleared');
    } catch (e) {
      console.error('Failed to clear chat history:', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!user) {
      onLoginClick();
      return;
    }

    // Check if blocked before sending - button already shows in UI
    if (isBlocked) {
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Save user message to Firebase
    if (user?.id) {
      await saveGPTMessage(user.id, userMessage);
    }

    try {
      const conversationMessages = [
        { role: 'system', content: 'You are GPT-5.2, a helpful, creative, and friendly AI assistant.' },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content }
      ];

      const res = await fetch('/api/chatgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Request failed');
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || 'No response';

      const assistantMessage: Message = {
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to Firebase
      if (user?.id) {
        await saveGPTMessage(user.id, assistantMessage);
      }
      
      // Credit deduction logic for paid plans
      if (!isFreePlan && user?.id) {
        const newUserMessageCount = userMessageCount + 1;
        
        // Deduct 1 credit every 10 messages
        if (newUserMessageCount % 10 === 0) {
          const currentCredits = user.credits || 0;
          const newCredits = Math.max(0, currentCredits - 1);
          
          try {
            await updateUserCredits(user.id, newCredits);
            console.log(`✅ Deducted 1 credit. New balance: ${newCredits}`);
            
            // Credits hit 0 - inline button will show automatically
            if (newCredits === 0) {
              console.log('⚠️ User out of credits - buy credits button will display');
            }
          } catch (err) {
            console.error('❌ Failed to deduct credits:', err);
          }
        }
      }
      
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-gray-900 flex flex-col">
      {/* Header with Clear Chat Button */}
      {user && messages.length > 0 && (
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-slate-900">GPT-5.2 Chat</span>
              <span className="text-xs text-slate-500">• {messages.length} messages</span>
            </div>
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <Bot className="w-12 h-12 text-indigo-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Start a conversation</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                Ask me anything! I'm GPT-5.2, ready to help with questions, ideas, coding, writing, and more.
              </p>
              {!user && (
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all"
                >
                  Sign in to start chatting
                </button>
              )}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              }`}>
                {msg.role === 'user' ? (
                  user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="You" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div className={`flex-1 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 text-sm md:text-base ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
                <div className="mt-1 px-1 text-xs text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 md:gap-4">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 max-w-[75%]">
                <div className="inline-block rounded-2xl px-4 py-3 bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Blocked Message with Buy Credit Button */}
          {isBlocked && user && (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {isFreePlan ? 'Free Plan Limit Reached' : 'No Credits Remaining'}
                </h3>
                <p className="text-slate-600">
                  {isFreePlan 
                    ? "You've used your 2 free messages. Get more credits to continue chatting with GPT-5.2!"
                    : "Your credits have run out. Purchase more credits to continue your conversation."}
                </p>
                <button
                  onClick={() => {
                    const message = isFreePlan 
                      ? 'Hello! I want to buy credits to continue using GPT-5.2 chat. I am currently on the free plan.'
                      : 'Hello! I need to buy more credits to continue using GPT-5.2 chat.';
                    window.open(`https://wa.me/212630961392?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black uppercase tracking-wide shadow-lg shadow-green-500/30 transition-all transform hover:scale-105"
                >
                  💰 Buy Credits to Continue
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Professional Design */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent border-t border-slate-200 px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Main Input Container */}
          <div className="relative bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-400 focus-within:border-slate-900 focus-within:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-2 p-2">
              {/* Left Icon: Attachment/Upload */}
              <button
                type="button"
                disabled={!user || isLoading || isBlocked}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Textarea Input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={user ? (isBlocked ? "Upgrade to continue chatting..." : "Message GPT-5.2...") : "Sign in to start chatting"}
                disabled={!user || isLoading || isBlocked}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-slate-900 placeholder-slate-500 text-sm md:text-base py-2.5 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px', lineHeight: '1.5' }}
              />

              {/* Right Icon: Voice/Mic */}
              <button
                type="button"
                disabled={!user || isLoading || isBlocked}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send Button - Inline */}
              <button
                onClick={handleSend}
                disabled={!user || isLoading || (!input.trim() && !isBlocked)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white transition-all shadow-sm hover:shadow-md disabled:shadow-none"
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-slate-700">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-slate-700">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-slate-700">Enter</kbd> for new line
            </span>
            {user && (
              <span className="font-semibold">
                {isFreePlan ? (
                  <span className={userMessageCount >= 2 ? 'text-red-600' : 'text-slate-600'}>
                    {2 - userMessageCount} free messages left
                  </span>
                ) : (
                  <span className={(user.credits || 0) <= 5 ? 'text-amber-600' : 'text-indigo-600'}>
                    💎 {user.credits || 0} credits · Next deduction at {10 - (userMessageCount % 10)} messages
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-scale-in">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {isFreePlan ? 'Upgrade to Continue' : 'Out of Credits'}
              </h2>
              <p className="text-slate-600">
                {isFreePlan 
                  ? "You've used your free 2 GPT-5.2 messages. Upgrade to Premium for unlimited access."
                  : "You've run out of credits. Buy more credits to continue chatting with GPT-5.2."}
              </p>
              {!isFreePlan && user && (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  Current balance: <span className="font-bold text-slate-900">{user.credits || 0} credits</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const message = isFreePlan 
                    ? 'Hello! I want to upgrade my plan to continue using GPT-5.2 chat.'
                    : 'Hello! I need to buy more credits to continue using GPT-5.2 chat.';
                  window.open(`https://wa.me/212630961392?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-wide shadow-lg transition-all"
              >
                {isFreePlan ? '💳 Upgrade Now' : '💰 Buy Credits Now To Continue'}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
