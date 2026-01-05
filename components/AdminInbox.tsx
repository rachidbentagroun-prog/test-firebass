/**
 * Admin Inbox Tab Component
 * 
 * Unified inbox for Contact Form messages and Chat Widget messages
 * This can be integrated into the existing AdminDashboard.tsx
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Filter, Eye, Send, Check, X, Clock } from 'lucide-react';
import {
  getContactMessages,
  updateContactMessageStatus,
  getChatSessions,
  getChatMessages,
  sendChatReply
} from '../services/adminService';

interface AdminInboxProps {
  adminId: string;
  adminEmail: string;
}

export const AdminInbox: React.FC<AdminInboxProps> = ({ adminId, adminEmail }) => {
  const [inboxFilter, setInboxFilter] = useState<'all' | 'contact' | 'chat'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, [inboxFilter, statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      if (inboxFilter === 'all' || inboxFilter === 'contact') {
        const status = statusFilter === 'all' ? undefined : statusFilter as any;
        const messages = await getContactMessages(status, 50);
        setContactMessages(messages);
      }

      if (inboxFilter === 'all' || inboxFilter === 'chat') {
        const sessions = await getChatSessions(50);
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContactMessage = async (message: any) => {
    setSelectedMessage(message);
    setSelectedSession(null);

    // Mark as read if new
    if (message.status === 'new') {
      await updateContactMessageStatus(message.id, 'read');
      fetchMessages(); // Refresh
    }
  };

  const handleSelectChatSession = async (session: any) => {
    setSelectedSession(session);
    setSelectedMessage(null);

    // Fetch chat messages for this session
    try {
      const messages = await getChatMessages(session.id);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  };

  const handleReplyToContact = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSending(true);
    try {
      await updateContactMessageStatus(
        selectedMessage.id,
        'replied',
        replyText,
        adminId
      );

      // TODO: Send actual email via Cloud Function or email service
      alert('Reply saved! Email sending functionality needs to be implemented.');

      setReplyText('');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!selectedSession || !replyText.trim()) return;

    setSending(true);
    try {
      await sendChatReply(selectedSession.id, replyText, adminId);

      setReplyText('');
      
      // Refresh chat messages
      const messages = await getChatMessages(selectedSession.id);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleArchiveMessage = async (messageId: string) => {
    try {
      await updateContactMessageStatus(messageId, 'archived');
      fetchMessages();
    } catch (error) {
      console.error('Failed to archive message:', error);
    }
  };

  // Calculate stats
  const newContactMessages = contactMessages.filter(m => m.status === 'new').length;
  const unreadChatSessions = chatSessions.filter(s => 
    s.status === 'active' && s.lastMessageSender === 'user'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Inbox</h2>
          <p className="text-gray-400">Unified inbox for contact form and chat messages</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-red-500/20 px-4 py-2 rounded-lg">
            <span className="text-red-400 font-bold">{newContactMessages}</span>
            <span className="text-gray-400 ml-2">New Contact</span>
          </div>
          <div className="bg-blue-500/20 px-4 py-2 rounded-lg">
            <span className="text-blue-400 font-bold">{unreadChatSessions}</span>
            <span className="text-gray-400 ml-2">Unread Chats</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {/* Source filter */}
        <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setInboxFilter('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              inboxFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="inline w-4 h-4 mr-2" />
            All
          </button>
          <button
            onClick={() => setInboxFilter('contact')}
            className={`px-4 py-2 rounded-md transition-colors ${
              inboxFilter === 'contact'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="inline w-4 h-4 mr-2" />
            Contact Form
          </button>
          <button
            onClick={() => setInboxFilter('chat')}
            className={`px-4 py-2 rounded-md transition-colors ${
              inboxFilter === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="inline w-4 h-4 mr-2" />
            Chat Widget
          </button>
        </div>

        {/* Status filter */}
        {inboxFilter !== 'chat' && (
          <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-md text-sm ${
                statusFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-2 rounded-md text-sm ${
                statusFilter === 'new' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              New
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-2 rounded-md text-sm ${
                statusFilter === 'read' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setStatusFilter('replied')}
              className={`px-3 py-2 rounded-md text-sm ${
                statusFilter === 'replied' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              Replied
            </button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="font-bold text-white mb-4">
            {inboxFilter === 'contact' ? 'Contact Messages' : 
             inboxFilter === 'chat' ? 'Chat Sessions' : 
             'All Messages'}
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <>
              {/* Contact Messages */}
              {(inboxFilter === 'all' || inboxFilter === 'contact') && 
                contactMessages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => handleSelectContactMessage(message)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id
                        ? 'bg-blue-600'
                        : message.status === 'new'
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-white">
                          {message.subject || 'No Subject'}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          message.status === 'new'
                            ? 'bg-green-500 text-white'
                            : message.status === 'read'
                            ? 'bg-blue-500 text-white'
                            : message.status === 'replied'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {message.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{message.userEmail}</p>
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                      {message.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {message.createdAt?.toDate?.().toLocaleString() || 'Unknown date'}
                    </p>
                  </div>
                ))}

              {/* Chat Sessions */}
              {(inboxFilter === 'all' || inboxFilter === 'chat') &&
                chatSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectChatSession(session)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-blue-600'
                        : session.status === 'active'
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-white">
                          {session.userName || 'Guest User'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {session.messageCount || 0} messages
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {session.userEmail || 'No email'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last: {session.lastMessageAt?.toDate?.().toLocaleString() || 'Unknown'}
                    </p>
                  </div>
                ))}

              {contactMessages.length === 0 && chatSessions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No messages found
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Details / Reply Panel */}
        <div className="bg-gray-800 rounded-lg p-4">
          {selectedMessage ? (
            /* Contact Message Details */
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedMessage.subject || 'No Subject'}
                  </h3>
                  <p className="text-sm text-gray-400">{selectedMessage.userEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedMessage.createdAt?.toDate?.().toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleArchiveMessage(selectedMessage.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Archive
                </button>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              {selectedMessage.replyContent && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Your Reply:</p>
                  <p className="text-gray-300">{selectedMessage.replyContent}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Replied: {selectedMessage.repliedAt?.toDate?.().toLocaleString()}
                  </p>
                </div>
              )}

              {selectedMessage.status !== 'replied' && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Reply:</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full h-32 bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleReplyToContact}
                    disabled={sending || !replyText.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              )}
            </div>
          ) : selectedSession ? (
            /* Chat Session Details */
            <div className="flex flex-col h-full">
              <div className="border-b border-gray-700 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white">
                  {selectedSession.userName || 'Guest User'}
                </h3>
                <p className="text-sm text-gray-400">{selectedSession.userEmail || 'No email'}</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] mb-4">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-gray-700 ml-0 mr-8'
                        : 'bg-blue-600 ml-8 mr-0'
                    }`}
                  >
                    <p className="text-white">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.createdAt?.toDate?.().toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-24 bg-gray-900 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={sending || !replyText.trim()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          ) : (
            /* No Selection */
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInbox;
