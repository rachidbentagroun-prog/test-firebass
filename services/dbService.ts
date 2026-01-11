
import { supabase } from './supabase';
import { GeneratedImage, GeneratedVideo, GeneratedAudio, User, SystemMessage, ChatMessage, SupportSession } from '../types';

const ADMIN_EMAIL = 'isambk92@gmail.com';

/**
 * Saves the current UI state (draft) of a specific multimodal engine for a user.
 */
export const saveWorkState = async (userId: string, moteurId: string, state: any): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_work_states')
      .upsert({
        user_id: userId,
        moteur_id: moteurId,
        state: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,moteur_id' });
    
    if (error) throw error;
  } catch (e: any) {
    console.warn(`Failed to persist work state for ${moteurId}:`, e.message || e);
  }
};

/**
 * Retrieves the saved UI state (draft) for a specific multimodal engine.
 */
export const getWorkState = async (userId: string, moteurId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('user_work_states')
      .select('state')
      .eq('user_id', userId)
      .eq('moteur_id', moteurId)
      .maybeSingle();

    if (error) throw error;
    return data?.state || null;
  } catch (e: any) {
    console.error(`Failed to retrieve work state for ${moteurId}:`, e.message || e);
    return null;
  }
};

/**
 * Universally dispatches a notification to the admin via System Messages and simulated Email.
 */
export const notifyAdminOfSupportRequest = async (session: SupportSession, messageText: string, isNewSession: boolean): Promise<void> => {
  try {
    // 1. Locate Admin Profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();

    if (!adminProfile) return;

    // 2. Create System Notification for Admin
    const subject = isNewSession 
      ? `🚨 NEW SUPPORT SESSION: ${session.name}`
      : `💬 ACTIVITY IN SESSION: ${session.id}`;
    
    const content = `User ${session.name} (${session.email || 'Guest'}) sent a message: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`;

    await sendMessageToUserInDB(adminProfile.id, {
      subject,
      content,
      sender: 'Support Watchdog'
    });

    // 3. Simulated Email Dispatch (Payload logged for verification)
    console.log(`%c [EMAIL DISPATCH] TO: ${ADMIN_EMAIL}`, 'background: #4f46e5; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    console.log({
      to: ADMIN_EMAIL,
      subject: subject,
      body: content,
      timestamp: new Date().toISOString(),
      metadata: { sessionId: session.id, userEmail: session.email }
    });

  } catch (e: any) {
    console.warn("Notification watchdog failed to trigger:", e.message);
  }
};

/**
 * User-initiated contact to admin. Creates a support session, records the message,
 * and triggers admin notification with simulated email dispatch.
 */
export const contactAdmin = async (
  name: string,
  email: string | undefined,
  userId: string | undefined,
  subject: string,
  message: string
): Promise<{ sessionId: string }> => {
  const session = await createSupportSession(name, email, userId);
  const payload = subject ? `${subject}\n\n${message}` : message;
  await sendSupportChatMessage(session.id, payload, 'user');
  await notifyAdminOfSupportRequest(session, payload, true);
  return { sessionId: session.id };
};

/**
 * Saves an AI-generated image to the Supabase database.
 */
export const saveImageToDB = async (image: GeneratedImage, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assets')
      .insert([{ 
        id: image.id, 
        user_id: userId, 
        type: 'image', 
        url: image.url, 
        prompt: image.prompt, 
        created_at: new Date(image.createdAt).toISOString(),
        metadata: { source: 'TTI' }
      }]);
    
    if (error) throw error;
  } catch (e: any) {
    console.warn("Failed to archive visual asset to database:", e.message || e);
  }
};

/**
 * Retrieves all images for a specific user.
 */
export const getImagesFromDB = async (userId: string): Promise<GeneratedImage[]> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'image')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      url: item.url,
      prompt: item.prompt,
      createdAt: new Date(item.created_at).getTime()
    }));
  } catch (e: any) {
    console.error("Database fetch failure (Images):", e.message || e);
    return [];
  }
};

/**
 * Saves an AI-generated video to the Supabase database.
 */
export const saveVideoToDB = async (video: GeneratedVideo, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assets')
      .insert([{ 
        id: video.id, 
        user_id: userId, 
        type: 'video', 
        url: video.url, 
        prompt: video.prompt, 
        metadata: { 
          aspectRatio: video.aspectRatio, 
          resolution: video.resolution, 
          uri: video.uri,
          source: 'TTV'
        },
        created_at: new Date(video.createdAt).toISOString() 
      }]);
    
    if (error) throw error;
  } catch (e: any) {
    console.warn("Failed to archive video sequence:", e.message || e);
  }
};

/**
 * Retrieves all videos for a specific user.
 */
export const getVideosFromDB = async (userId: string): Promise<GeneratedVideo[]> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'video')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      url: item.url,
      uri: item.metadata?.uri || '',
      prompt: item.prompt,
      createdAt: new Date(item.created_at).getTime(),
      aspectRatio: item.metadata?.aspectRatio,
      resolution: item.metadata?.resolution
    }));
  } catch (e: any) {
    console.error("Database fetch failure (Videos):", e.message || e);
    return [];
  }
};

/**
 * Saves an AI-generated audio (TTS) to the Supabase database.
 */
export const saveAudioToDB = async (audio: GeneratedAudio, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assets')
      .insert([{ 
        id: audio.id, 
        user_id: userId, 
        type: 'audio', 
        url: audio.url, 
        prompt: audio.text, 
        metadata: { 
          voice: audio.voice,
          isCloned: audio.isCloned,
          source: 'TTS'
        },
        created_at: new Date(audio.createdAt).toISOString() 
      }]);
    
    if (error) throw error;
  } catch (e: any) {
    console.warn("Failed to archive vocalization:", e.message || e);
  }
};

/**
 * Retrieves all audio files for a specific user.
 */
export const getAudioFromDB = async (userId: string): Promise<GeneratedAudio[]> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'audio')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      id: item.id,
      url: item.url,
      text: item.prompt,
      voice: item.metadata?.voice || 'Kore',
      createdAt: new Date(item.created_at).getTime(),
      isCloned: item.metadata?.isCloned
    }));
  } catch (e: any) {
    console.error("Database fetch failure (Audio):", e.message || e);
    return [];
  }
};

/**
 * Universal deletion from Supabase.
 */
export const deleteAssetFromDB = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (e: any) {
    throw new Error(`Purge sequence failed: ${e.message || e}`);
  }
};

export const updateUserCredits = async (userId: string, credits: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ credits, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  } catch (e: any) {
    console.error("Credit update disruption:", e.message || e);
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User> | any): Promise<void> => {
  try {
    const payload: any = {};
    if (updates.name) payload.full_name = updates.name;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;
    if (updates.plan) payload.plan = updates.plan;
    if (updates.role) payload.role = updates.role;
    if (updates.credits !== undefined) payload.credits = updates.credits;
    if (updates.status) payload.status = updates.status;
    if (updates.email) payload.email = updates.email;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        ...payload,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    if (error) throw error;
  } catch (e: any) {
    throw new Error(`Identity modification failed: ${e.message || e}`);
  }
};

/* --- SUPPORT CHAT METHODS --- */

export const createSupportSession = async (name: string, email?: string, userId?: string): Promise<SupportSession> => {
  const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
  const { data, error } = await supabase
    .from('support_sessions')
    .insert([{
      id: sessionId,
      user_id: userId || null,
      name: name,
      email: email || null,
      is_guest: !userId,
      last_message_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    isGuest: data.is_guest,
    chatHistory: [],
    lastMessageAt: new Date(data.last_message_at).getTime()
  };
};

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return data.map(m => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: new Date(m.created_at).getTime()
  }));
};

export const sendSupportChatMessage = async (sessionId: string, text: string, sender: 'user' | 'support'): Promise<void> => {
  const { error } = await supabase
    .from('support_messages')
    .insert([{
      session_id: sessionId,
      sender: sender,
      text: text
    }]);

  if (error) throw error;

  await supabase
    .from('support_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId);
};

export const getAllSupportSessions = async (): Promise<SupportSession[]> => {
  const { data, error } = await supabase
    .from('support_sessions')
    .select(`
      *,
      support_messages (
        id, sender, text, created_at
      )
    `)
    .order('last_message_at', { ascending: false });

  if (error) return [];
  return data.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    isGuest: s.is_guest,
    lastMessageAt: new Date(s.last_message_at).getTime(),
    chatHistory: (s.support_messages || []).map((m: any) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.created_at).getTime()
    })).sort((a: any, b: any) => a.timestamp - b.timestamp)
  }));
};

export const getSupportSessionsForUser = async (userId: string): Promise<SupportSession[]> => {
  const { data, error } = await supabase
    .from('support_sessions')
    .select(`
      *,
      support_messages (
        id, sender, text, created_at
      )
    `)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) return [];
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    isGuest: s.is_guest,
    lastMessageAt: new Date(s.last_message_at).getTime(),
    chatHistory: (s.support_messages || []).map((m: any) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: new Date(m.created_at).getTime()
    })).sort((a: any, b: any) => a.timestamp - b.timestamp)
  }));
};

/* --- ADMIN METHODS --- */

export const getAllUsersFromDB = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.full_name || 'Creator',
      email: p.email,
      role: p.role || 'user',
      plan: p.plan || 'free',
      credits: p.credits ?? 0,
      isRegistered: true,
      isVerified: true,
      gallery: [],
      avatarUrl: p.avatar_url,
      status: p.status || 'active',
      joinedAt: p.created_at ? new Date(p.created_at).getTime() : Date.now()
    }));
  } catch (e: any) {
    console.error("Admin user directory fetch failed:", e.message || e);
    return [];
  }
};

export const deleteUserFromDB = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  } catch (e: any) {
    throw new Error(`Node deletion disruption: ${e.message || e}`);
  }
};

export const getSystemMessagesForUser = async (userId: string): Promise<SystemMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Gracefully handle missing 'messages' table
      if (error.code === '42P01') return []; 
      throw error;
    }
    
    return (data || []).map(m => ({
      id: m.id,
      sender: m.sender || 'System',
      subject: m.subject || 'Notification',
      content: m.content || '',
      timestamp: new Date(m.created_at).getTime(),
      isRead: m.is_read ?? false
    }));
  } catch (e: any) {
    return [];
  }
};

export const sendMessageToUserInDB = async (userId: string, msg: {subject: string, content: string, sender?: string}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('messages')
      .insert([{
        user_id: userId,
        subject: msg.subject,
        content: msg.content,
        sender: msg.sender || 'ImaginAI Command',
        is_read: false
      }]);
    if (error) throw error;
  } catch (e: any) {
    console.error("Direct transmit disruption:", e.message || e);
  }
};

export const broadcastMessageToAllInDB = async (msg: {subject: string, content: string}): Promise<void> => {
  try {
    const users = await getAllUsersFromDB();
    const inserts = users.map(u => ({
      user_id: u.id,
      subject: msg.subject,
      content: msg.content,
      sender: 'ImaginAI Global Broadcast',
      is_read: false
    }));

    const { error } = await supabase
      .from('messages')
      .insert(inserts);
    if (error) throw error;
  } catch (e) {
    console.error(
      "Global broadcast disruption:",
      e instanceof Error ? e.message : String(e)
    );
  }
};

// --- Analytics & Email Helpers ---

/**
 * Logs a page/traffic event into the `analytics` table if available.
 * This is soft-fail: if the table doesn't exist we simply console.log the event.
 */
export const logTrafficEvent = async (event: { path: string; referrer?: string; userAgent?: string; userId?: string | null; country?: string | null }) => {
  try {
    const { error } = await supabase
      .from('analytics')
      .insert([{ 
        path: event.path,
        referrer: event.referrer || 'direct',
        user_agent: event.userAgent || null,
        user_id: event.userId || null,
        country: event.country || null,
        created_at: new Date().toISOString()
      }]);
    if (error) throw error;
  } catch (e: any) {
    // Table might not exist in lightweight dev DBs — fallback to logging
    console.warn('Analytics logging unavailable:', e.message || e, 'Event:', event);
  }
};

/**
 * Fetch recent traffic events (last `days` days) for admin analytics.
 */
export const getTrafficEvents = async (days = 30): Promise<any[]> => {
  try {
    const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e: any) {
    console.warn('Failed to fetch traffic events:', e.message || e);
    return [];
  }
};

/**
 * Simulated email dispatch for admin -> user communications. Will attempt to write
 * into an `email_queue` table if it exists, otherwise logs to console.
 */
export const sendEmailToUser = async (toEmail: string, subject: string, body: string): Promise<void> => {
  try {
    console.log('[EMAIL DISPATCH] to:', toEmail, 'subject:', subject);
    const { error } = await supabase
      .from('email_queue')
      .insert([{ to: toEmail, subject, body, created_at: new Date().toISOString() }]);
    if (error) throw error;
  } catch (e: any) {
    console.warn('Email queue not available, falling back to console log:', e.message || e);
  }
};

// ============================================
// GPT CHAT HISTORY FUNCTIONS
// ============================================

interface GPTMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * Save a GPT chat message to Firebase for a user
 */
export const saveGPTMessage = async (userId: string, message: GPTMessage): Promise<void> => {
  try {
    const { getFirestore, collection, addDoc } = await import('firebase/firestore');
    const db = getFirestore();
    
    await addDoc(collection(db, 'users', userId, 'gpt_chat_history'), {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to save GPT message:', e);
  }
};

/**
 * Load GPT chat history for a user
 */
export const loadGPTChatHistory = async (userId: string): Promise<GPTMessage[]> => {
  try {
    const { getFirestore, collection, query, orderBy, getDocs } = await import('firebase/firestore');
    const db = getFirestore();
    
    const q = query(
      collection(db, 'users', userId, 'gpt_chat_history'),
      orderBy('timestamp', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const messages: GPTMessage[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        role: data.role,
        content: data.content,
        timestamp: data.timestamp
      });
    });
    
    return messages;
  } catch (e) {
    console.error('Failed to load GPT chat history:', e);
    return [];
  }
};

/**
 * Clear GPT chat history for a user
 */
export const clearGPTChatHistory = async (userId: string): Promise<void> => {
  try {
    const { getFirestore, collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const db = getFirestore();
    
    const snapshot = await getDocs(collection(db, 'users', userId, 'gpt_chat_history'));
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('✅ GPT chat history cleared for user:', userId);
  } catch (e) {
    console.error('Failed to clear GPT chat history:', e);
  }
};

