
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, DollarSign, TrendingUp, Activity, Search, 
  Edit3, Trash2, Save, Globe,
  X, Check, Mail, Send, 
  FileText, Layout, Menu as MenuIcon, MonitorPlay,
  Zap, ChevronRight, BarChart3,
  RefreshCw, Key, Shield, ShieldCheck,
  CreditCard, ChevronDown, Monitor, Clock, Terminal,
  Plus, Layers, Video as VideoIcon, Image as ImageIcon,
  Mic2, AlertTriangle, AlertCircle, Info, Bell, MessageSquare, User as UserIcon,
  Filter, UserCheck, UserMinus, ShieldAlert, Ban, Eye, MapPin
} from 'lucide-react';
import { 
  User, SiteConfig, Plan, AIJob, SystemMessage, SupportSession, ChatMessage
} from '../types';
import { MOCK_REVENUE_DATA, MOCK_COUNTRY_DATA } from '../utils/mockData';
import { getAllSupportSessions, sendSupportChatMessage } from '../services/dbService';
import { 
  getAnalyticsFromFirebase, 
  getLiveGenerations,
  getGenerationAnalytics,
  updateUserStatus, 
  addUserCredits, 
  sendEmailToUser,
  getUserIPLogs,
  blockIPAddress,
  unblockIPAddress,
  getBlockedIPs,
  getCreditConfig,
  updateCreditConfig,
  grantUserCredits,
  getGlobalCreditStats,
  getCreditLogs,
  getUsageLogs,
  getAIActivity,
  subscribeToAIActivity,
  getAdminAuditLogs,
  getAbuseDetectionLogs
} from '../services/firebase';

interface AdminDashboardProps {
  users: User[];
  siteConfig: SiteConfig;
  onUpdateConfig: (newConfig: SiteConfig) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser: (user: User) => void;
  onSendMessageToUser: (userId: string, message: {subject: string, content: string}) => void;
  onBroadcastMessage: (message: {subject: string, content: string}) => void;
  onSupportReply: (userId: string, text: string) => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onSyncFirebase?: () => Promise<void>;
}

const INITIAL_JOBS: AIJob[] = [
  { id: 'job_882', userId: 'u1', userName: 'Alex Rivera', type: 'video', status: 'processing', progress: 65, duration: '2:14', createdAt: Date.now() - 5000 },
  { id: 'job_901', userId: 'u2', userName: 'Sarah Chen', type: 'image', status: 'queued', progress: 0, createdAt: Date.now() - 2000 },
  { id: 'job_772', userId: 'u3', userName: 'Mark J.', type: 'image', status: 'completed', progress: 100, duration: '0:12', createdAt: Date.now() - 120000 },
  { id: 'job_229', userId: 'u5', userName: 'Liam W.', type: 'audio', status: 'processing', progress: 34, duration: '1:05', createdAt: Date.now() - 15000 },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, siteConfig, onUpdateConfig, onDeleteUser, onUpdateUser, 
  onSendMessageToUser, onBroadcastMessage, onSupportReply, hasApiKey, onSelectKey, onSyncFirebase
}) => {
  console.log('🔵 [AdminDashboard] MOUNTED - users:', users?.length || 0);
  
  try {
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'credits' | 'live-ai' | 'support' | 'broadcast' | 'api' | 'cms'>('overview');
  const [cmsTab, setCmsTab] = useState<'general' | 'plans' | 'landing'>('general');
  const [localConfig, setLocalConfig] = useState<SiteConfig>(siteConfig);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'basic' | 'premium'>('all');
  const [jobs, setJobs] = useState<AIJob[]>(INITIAL_JOBS);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [broadcastData, setBroadcastData] = useState({ subject: '', content: '' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Enhanced analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Generations live state
  const [liveGenerations, setLiveGenerations] = useState<any[]>([]);
  const [liveGenStats, setLiveGenStats] = useState<any>(null);
  const [liveGenLoading, setLiveGenLoading] = useState(false);
  const liveGenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userIPLogs, setUserIPLogs] = useState<any[]>([]);
  const [loadingIPLogs, setLoadingIPLogs] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [emailData, setEmailData] = useState({ subject: '', content: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [addingCredits, setAddingCredits] = useState(false);
  
  // Blocked IPs state
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [loadingBlockedIPs, setLoadingBlockedIPs] = useState(false);

  // Support state
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Credit System state
  const [creditConfig, setCreditConfig] = useState<any>({
    imageCost: 1,
    videoCostPerSecond: 5,
    voiceCostPerMinute: 2,
    chatCostPerToken: 0.001,
    imageHDCost: 2,
    video4KCost: 10,
    freeSignupCredits: 10,
    basicPlanCredits: 100,
    premiumPlanCredits: 500
  });
  const [creditStats, setCreditStats] = useState<any>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Live AI Activity state
  const [aiActivities, setAiActivities] = useState<any[]>([]);
  const [aiActivityLoading, setAiActivityLoading] = useState(false);
  const [abuseDetections, setAbuseDetections] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const aiActivityUnsubscribeRef = useRef<(() => void) | null>(null);

  // AI Engine Pricing state
  const [engines, setEngines] = useState<any[]>([]);
  const [engineLoading, setEngineLoading] = useState(false);
  const [editingEngine, setEditingEngine] = useState<any | null>(null);
  const [engineStats, setEngineStats] = useState<any>(null);

  // Plan Pricing Overrides state
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [planOverrides, setPlanOverrides] = useState<any>({});
  const [planOverrideFilter, setPlanOverrideFilter] = useState<string>('image');
  const [savingPlanOverrides, setSavingPlanOverrides] = useState(false);

  useEffect(() => { setLocalConfig(siteConfig); }, [siteConfig]);

  useEffect(() => {
    if (activeTab === 'support') {
      fetchSessions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  const fetchSessions = async () => {
    try {
      const data = await getAllSupportSessions();
      setSessions(data);
    } catch (e) {
      console.error("Support session sync failure", e);
    }
  };

  const handleSupportReply = async () => {
    if (!activeSessionId || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await sendSupportChatMessage(activeSessionId, replyText, 'support');
      setReplyText('');
      await fetchSessions();
    } catch (e) {
      alert("Reply transmission failed.");
    } finally {
      setIsReplying(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Traffic analytics state
  const [trafficEvents, setTrafficEvents] = useState<any[]>([]);
  const [dailyTraffic, setDailyTraffic] = useState<Array<{date: string, visits: number, uniqueVisitors: number}>>([]);
  const [countries, setCountries] = useState<Array<{country: string, count: number, percentage: number}>>([]);
  const [referrers, setReferrers] = useState<Array<{referrer: string, count: number, percentage: number}>>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [gaRealtime, setGaRealtime] = useState<{ activeUsers: number; eventCount: number; events: { name: string; active: number; count: number; }[] } | null>(null);
  const [gaLoading, setGaLoading] = useState(false);
  const [gaError, setGaError] = useState<string | null>(null);

  const fetchTraffic = async () => {
    setTrafficLoading(true);
    try {
      const { getTrafficEvents } = await import('../services/dbService');
      const events = await getTrafficEvents(30);
      setTrafficEvents(events);
      const total = events.length || 1;

      // Calculate daily traffic volume
      const dailyMap: Record<string, { visits: Set<string>, totalVisits: number }> = {};
      events.forEach((ev: any) => {
        const date = new Date(ev.timestamp || ev.created_at).toISOString().split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { visits: new Set(), totalVisits: 0 };
        }
        dailyMap[date].totalVisits++;
        if (ev.userId || ev.sessionId) {
          dailyMap[date].visits.add(ev.userId || ev.sessionId);
        }
      });

      const dailyArray = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          visits: data.totalVisits,
          uniqueVisitors: data.visits.size
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14); // Last 14 days

      setDailyTraffic(dailyArray);

      // Countries
      const countryCounts: Record<string, number> = {};
      events.forEach((ev: any) => { const c = ev.country || 'Unknown'; countryCounts[c] = (countryCounts[c] || 0) + 1; });
      const countryArr = Object.entries(countryCounts).map(([country, count]) => ({ country, count: count as number, percentage: ((count as number) / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 6);
      setCountries(countryArr);

      // Referrers (extract hostname)
      const refCounts: Record<string, number> = {};
      events.forEach((ev: any) => {
        const raw = ev.referrer || 'direct';
        let host = 'direct';
        try { if (raw && raw !== 'direct') host = new URL(raw).hostname.replace('www.', ''); } catch (e) { host = raw || 'direct'; }
        refCounts[host] = (refCounts[host] || 0) + 1;
      });
      const refArr = Object.entries(refCounts).map(([referrer, count]) => ({ referrer, count: count as number, percentage: ((count as number) / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 6);
      setReferrers(refArr);
    } catch (e) {
      console.warn('Failed to fetch analytics:', e);
      setDailyTraffic([]);
      setCountries([]);
      setReferrers([]);
    } finally {
      setTrafficLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchTraffic();
      fetchGoogleAnalyticsRealtime();
      fetchFirebaseAnalytics();
      fetchLiveGenerationData();

      const interval = setInterval(fetchLiveGenerationData, 5000);
      liveGenIntervalRef.current = interval;
      return () => {
        clearInterval(interval);
        liveGenIntervalRef.current = null;
      };
    }

    if (liveGenIntervalRef.current) {
      clearInterval(liveGenIntervalRef.current);
      liveGenIntervalRef.current = null;
    }
  }, [activeTab]);

  // Load credit system data
  useEffect(() => {
    if (activeTab === 'credits') {
      (async () => {
        try {
          const config = await getCreditConfig();
          setCreditConfig(config);
          const stats = await getGlobalCreditStats(30);
          setCreditStats(stats);

          // Load engines
          setEngineLoading(true);
          const { getAllEngines, getEngineStats } = await import('../services/firebase');
          const allEngines = await getAllEngines();
          setEngines(allEngines);
          
                    // Load subscription plans and overrides
                    const { getAllSubscriptionPlans, getPlanPricingOverrides } = await import('../services/firebase');
                    const plans = await getAllSubscriptionPlans();
                    setSubscriptionPlans(plans);
          
                    // Load overrides for selected plan
                    const overrides = await getPlanPricingOverrides(selectedPlan);
                    setPlanOverrides(overrides || { plan_id: selectedPlan, ai_types: {} });
          
          // Load engine stats
          const engStats = await getEngineStats(undefined, 30);
          setEngineStats(engStats);
          setEngineLoading(false);
        } catch (err) {
          console.error('Failed to load credit data:', err);
          setEngineLoading(false);
        }
      })();
    }
  }, [activeTab]);

  // Setup real-time AI activity listener
  useEffect(() => {
    if (activeTab === 'live-ai') {
      // Load initial data
      (async () => {
        setAiActivityLoading(true);
        try {
          const [activities, abuseLogs, auditLogsList] = await Promise.all([
            getAIActivity(100),
            getAbuseDetectionLogs(50),
            getAdminAuditLogs(50)
          ]);
          setAiActivities(activities);
          setAbuseDetections(abuseLogs);
          setAuditLogs(auditLogsList);
        } catch (err) {
          console.error('Failed to load AI activity data:', err);
        } finally {
          setAiActivityLoading(false);
        }
      })();

      // Setup real-time listener
      const unsubscribe = subscribeToAIActivity((activities) => {
        setAiActivities(activities);
      }, 100);
      
      aiActivityUnsubscribeRef.current = unsubscribe;

      return () => {
        if (aiActivityUnsubscribeRef.current) {
          aiActivityUnsubscribeRef.current();
          aiActivityUnsubscribeRef.current = null;
        }
      };
    }

    // Cleanup listener when leaving tab
    if (aiActivityUnsubscribeRef.current) {
      aiActivityUnsubscribeRef.current();
      aiActivityUnsubscribeRef.current = null;
    }
  }, [activeTab]);

  // Fetch Firebase Analytics
  const fetchFirebaseAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await getAnalyticsFromFirebase(30);
      setAnalyticsData(data);
    } catch (e) {
      console.warn('Failed to fetch Firebase analytics:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch Google Analytics Realtime (requires GA env vars & serverless handler)
  const fetchGoogleAnalyticsRealtime = async () => {
    setGaLoading(true);
    setGaError(null);
    try {
      const resp = await fetch('/api/ga-realtime');
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to fetch GA realtime metrics');
      }
      const json = await resp.json();
      setGaRealtime(json);
    } catch (e: any) {
      setGaError(e?.message || 'GA realtime unavailable');
      setGaRealtime(null);
    } finally {
      setGaLoading(false);
    }
  };

  // Fetch live generations + analytics
  const fetchLiveGenerationData = async () => {
    setLiveGenLoading(true);
    try {
      const [generations, genStats] = await Promise.all([
        getLiveGenerations(),
        getGenerationAnalytics(7)
      ]);

      setLiveGenerations(generations || []);
      setLiveGenStats(genStats || null);
    } catch (e) {
      console.warn('Failed to fetch live generations:', e);
      setLiveGenerations([]);
      setLiveGenStats(null);
    } finally {
      setLiveGenLoading(false);
    }
  };

  // Fetch user IP logs
  const fetchUserIPLogs = async (userId: string) => {
    setLoadingIPLogs(true);
    try {
      const logs = await getUserIPLogs(userId);
      setUserIPLogs(logs);
    } catch (e) {
      console.warn('Failed to fetch IP logs:', e);
      setUserIPLogs([]);
    } finally {
      setLoadingIPLogs(false);
    }
  };

  // Fetch blocked IPs
  const fetchBlockedIPs = async () => {
    setLoadingBlockedIPs(true);
    try {
      const ips = await getBlockedIPs();
      setBlockedIPs(ips);
    } catch (e) {
      console.warn('Failed to fetch blocked IPs:', e);
    } finally {
      setLoadingBlockedIPs(false);
    }
  };

  // Handle suspend/activate user with optional free-form reason
  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const rawReason = newStatus === 'suspended' 
      ? prompt('Enter suspension reason (optional):', 'Admin decision') 
      : null;
    const suspensionReason = newStatus === 'suspended' ? (rawReason?.trim() || 'Admin decision') : undefined;
    
    try {
      await updateUserStatus(user.id, newStatus, suspensionReason);
      onUpdateUser({ ...user, status: newStatus });
      alert(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully!`);
    } catch (e) {
      alert('Failed to update user status');
    }
  };

  // Handle add credits
  const handleAddCredits = async () => {
    if (!selectedUser || creditAmount <= 0) return;
    
    setAddingCredits(true);
    try {
      await addUserCredits(selectedUser.id, creditAmount, 'Admin grant');
      onUpdateUser({ ...selectedUser, credits: selectedUser.credits + creditAmount });
      alert(`Successfully added ${creditAmount} credits to ${selectedUser.name}`);
      setCreditAmount(0);
    } catch (e) {
      alert('Failed to add credits');
    } finally {
      setAddingCredits(false);
    }
  };

  // Handle send email to user
  const handleSendEmail = async () => {
    if (!selectedUser || !emailData.subject || !emailData.content) return;
    
    setSendingEmail(true);
    try {
      await sendEmailToUser(selectedUser.id, emailData.subject, emailData.content, selectedUser.email);
      alert(`Email sent to ${selectedUser.name} successfully!`);
      setEmailData({ subject: '', content: '' });
    } catch (e) {
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle block IP
  const handleBlockIP = async (ipAddress: string) => {
    const reason = prompt('Reason for blocking this IP:');
    if (!reason) return;
    
    try {
      await blockIPAddress(ipAddress, reason);
      alert(`IP ${ipAddress} blocked successfully!`);
      await fetchUserIPLogs(selectedUser!.id);
      await fetchBlockedIPs();
    } catch (e) {
      alert('Failed to block IP');
    }
  };

  // Handle unblock IP
  const handleUnblockIP = async (ipAddress: string) => {
    try {
      await unblockIPAddress(ipAddress);
      alert(`IP ${ipAddress} unblocked successfully!`);
      await fetchBlockedIPs();
    } catch (e) {
      alert('Failed to unblock IP');
    }
  };

  // Open user detail modal
  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    fetchUserIPLogs(user.id);
    fetchBlockedIPs();
  };

  // Simulated live job updates for the overview tab
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.status === 'processing') {
          const nextProgress = Math.min(100, job.progress + Math.floor(Math.random() * 5));
          return { ...job, progress: nextProgress, status: nextProgress === 100 ? 'completed' : 'processing' };
        }
        return job;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTestEngine = async () => {
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsVerifying(false);
    alert(hasApiKey ? "Handshake Successful: 100% Signal Integrity." : "Link Failure: No valid API Key provisioned.");
  };

  const handleBroadcast = async () => {
    if (!broadcastData.subject || !broadcastData.content) return;
    setIsBroadcasting(true);
    await onBroadcastMessage(broadcastData);
    setBroadcastData({ subject: '', content: '' });
    setIsBroadcasting(false);
  };

  const handleUpdateLocalConfig = (field: keyof SiteConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCommitCMS = () => {
    onUpdateConfig(localConfig);
    alert("Site Matrix configurations synchronized.");
  };

  // Advanced Filtering
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const matchesPlan = planFilter === 'all' || u.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const renderTabs = () => (
    <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 overflow-x-auto max-w-full no-scrollbar shadow-inner">
      {[
        { id: 'overview', label: 'Dashboard', icon: Layout },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'credits', label: 'Credits', icon: CreditCard },
        { id: 'live-ai', label: 'Live AI', icon: Activity },
        { id: 'support', label: 'Support', icon: MessageSquare },
        { id: 'broadcast', label: 'Broadcast', icon: Bell },
        { id: 'api', label: 'TTV Link', icon: Key },
        { id: 'cms', label: 'Matrix CMS', icon: FileText },
      ].map(tab => (
        <button 
          key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <tab.icon className="w-4 h-4" /> {tab.label}
        </button>
      ))}
    </div>
  );

  console.log('[AdminDashboard] Rendering with users:', users.length, 'activeTab:', activeTab);

  return (
    <div 
      className="w-full" 
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom, #1f2937 0%, #111827 50%, #1f2937 100%)',
        color: '#ffffff'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 pb-40">
        
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-600/20"><Shield className="w-8 h-8 text-white" /></div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control Center</h1>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Secure Admin Protocol v5.0</p>
            </div>
          </div>
          {renderTabs()}
        </div>

      {activeTab === 'overview' && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
             <div className="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <DollarSign className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Global Revenue</p>
                <h3 className="text-3xl font-black text-white">$14,820.00</h3>
                <p className="text-[10px] text-green-500 font-black mt-2 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +15.2% this week</p>
             </div>
             <div className="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <Users className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Registered Users</p>
                <h3 className="text-3xl font-black text-white">{users.length}</h3>
                <p className="text-[10px] text-indigo-400 font-black mt-2 uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3" /> Total Database Nodes</p>
             </div>
             <div className="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <Zap className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Neural Syncs</p>
                <h3 className="text-3xl font-black text-white">{jobs.filter(j => j.status === 'processing').length}</h3>
                <p className="text-[10px] text-indigo-400 font-black mt-2 uppercase tracking-widest">Live Buffer Active</p>
             </div>
             <div className="bg-dark-900 border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <Activity className="absolute -right-4 -top-4 w-24 h-24 opacity-5 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">System Health</p>
                <h3 className="text-3xl font-black text-green-500 uppercase italic tracking-tighter">Optimal</h3>
                <p className="text-[10px] text-gray-600 font-black mt-2 uppercase tracking-widest">Uptime: 100%</p>
             </div>
          </div>

          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center gap-3"><MonitorPlay className="w-6 h-6 text-indigo-400" /> Live Projection Buffer</h3>
            <div className="space-y-4">
               {jobs.length > 0 ? jobs.map(job => (
                 <div key={job.id} className="flex items-center gap-6 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <div className={`p-3 rounded-xl ${job.type === 'video' ? 'bg-indigo-500/20 text-indigo-400' : (job.type === 'audio' ? 'bg-pink-500/20 text-pink-400' : 'bg-green-500/20 text-green-400')}`}>
                      {job.type === 'video' ? <VideoIcon className="w-5 h-5" /> : (job.type === 'audio' ? <Mic2 className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />)}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-2">
                         <p className="text-sm font-black text-white uppercase">{job.userName}</p>
                         <p className="text-[10px] font-bold text-gray-600">{job.id} • {job.duration || '∞'}</p>
                       </div>
                       <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${job.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{width: `${job.progress}%`}} />
                       </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${job.status === 'processing' ? 'text-indigo-400 animate-pulse' : (job.status === 'failed' ? 'text-red-500' : 'text-green-500')}`}>{job.status}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-20 text-center opacity-30 italic">No active production cycles detected.</div>
               )}
            </div>
          </div>

          {/* PLAN PRICING OVERRIDES */}
          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-purple-600 rounded-2xl">
                              <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-white uppercase italic">Plan Pricing Overrides</h3>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                Set custom pricing per subscription plan
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              setSavingPlanOverrides(true);
                              try {
                                const { setPlanPricingOverrides } = await import('../services/firebase');
                                await setPlanPricingOverrides(selectedPlan, planOverrides);
                                alert('✅ Plan pricing overrides saved successfully!');
                              } catch (err: any) {
                                alert('❌ Failed to save overrides: ' + err.message);
                              } finally {
                                setSavingPlanOverrides(false);
                              }
                            }}
                            disabled={savingPlanOverrides}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {savingPlanOverrides ? 'Saving...' : 'Save Overrides'}
                          </button>
                        </div>

                        {/* Plan Selector */}
                        <div className="mb-6 flex items-center gap-4">
                          <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Select Plan:</label>
                          <select
                            value={selectedPlan}
                            onChange={async (e) => {
                              const newPlan = e.target.value;
                              setSelectedPlan(newPlan);
                  
                              // Load overrides for this plan
                              const { getPlanPricingOverrides } = await import('../services/firebase');
                              const overrides = await getPlanPricingOverrides(newPlan);
                              setPlanOverrides(overrides || { plan_id: newPlan, ai_types: {} });
                            }}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold outline-none focus:border-purple-500"
                          >
                            {subscriptionPlans.map(plan => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} - ${plan.monthly_price}/mo
                              </option>
                            ))}
                          </select>

                          {/* AI Type Filter */}
                          <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-8">AI Type:</label>
                          <div className="flex gap-2">
                            {['image', 'video', 'voice', 'chat'].map(type => (
                              <button
                                key={type}
                                onClick={() => setPlanOverrideFilter(type)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                  planOverrideFilter === type 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Engine Override List */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-white/10">
                            <div className="col-span-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Engine</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Default Cost</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Override Cost</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Enabled</div>
                            <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</div>
                          </div>

                          {engines
                            .filter(engine => engine.ai_type === planOverrideFilter)
                            .map(engine => {
                              const override = planOverrides?.ai_types?.[planOverrideFilter]?.[engine.id];
                              const hasOverride = !!override;
                              const overrideCost = override?.cost || engine.base_cost;
                              const isEnabled = override?.enabled !== false;

                              return (
                                <div key={engine.id} className="grid grid-cols-12 gap-4 p-4 bg-black/20 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                                  <div className="col-span-4 flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${engine.is_active ? 'bg-green-500' : 'bg-gray-600'}`} />
                                    <div>
                                      <p className="text-sm font-bold text-white">{engine.engine_name}</p>
                                      <p className="text-[10px] text-gray-500 uppercase">{engine.id}</p>
                                    </div>
                                  </div>

                                  <div className="col-span-2 flex items-center">
                                    <span className="text-sm font-bold text-gray-400">{engine.base_cost} credits</span>
                                  </div>

                                  <div className="col-span-2 flex items-center">
                                    <input 
                                      type="number"
                                      step="0.01"
                                      value={overrideCost}
                                      onChange={(e) => {
                                        const newCost = parseFloat(e.target.value) || 0;
                                        setPlanOverrides({
                                          ...planOverrides,
                                          ai_types: {
                                            ...planOverrides.ai_types,
                                            [planOverrideFilter]: {
                                              ...planOverrides.ai_types?.[planOverrideFilter],
                                              [engine.id]: {
                                                cost: newCost,
                                                enabled: isEnabled
                                              }
                                            }
                                          }
                                        });
                                      }}
                                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-purple-500"
                                    />
                                  </div>

                                  <div className="col-span-2 flex items-center">
                                    <button
                                      onClick={() => {
                                        setPlanOverrides({
                                          ...planOverrides,
                                          ai_types: {
                                            ...planOverrides.ai_types,
                                            [planOverrideFilter]: {
                                              ...planOverrides.ai_types?.[planOverrideFilter],
                                              [engine.id]: {
                                                cost: overrideCost,
                                                enabled: !isEnabled
                                              }
                                            }
                                          }
                                        });
                                      }}
                                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                        isEnabled 
                                          ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                                          : 'bg-red-600/20 text-red-400 border border-red-600/30'
                                      }`}
                                    >
                                      {isEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                  </div>

                                  <div className="col-span-2 flex items-center">
                                    {hasOverride ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-purple-600/30">
                                          Override Active
                                        </span>
                                        <button
                                          onClick={async () => {
                                            const newOverrides = { ...planOverrides };
                                            if (newOverrides.ai_types?.[planOverrideFilter]?.[engine.id]) {
                                              delete newOverrides.ai_types[planOverrideFilter][engine.id];
                                            }
                                            setPlanOverrides(newOverrides);
                                
                                            // Save immediately
                                            try {
                                              const { removePlanEngineOverride } = await import('../services/firebase');
                                              await removePlanEngineOverride(selectedPlan, planOverrideFilter, engine.id);
                                              alert('✅ Override removed');
                                            } catch (err: any) {
                                              alert('❌ Failed: ' + err.message);
                                            }
                                          }}
                                          className="p-1 hover:bg-red-600/10 rounded text-red-400"
                                          title="Remove override"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Using Default</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Info Banner */}
                        <div className="mt-6 p-4 bg-purple-600/10 border border-purple-600/20 rounded-xl">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-purple-300 mb-1">
                                💡 Pricing Resolution Priority
                              </p>
                              <p className="text-xs text-gray-400">
                                1. Plan-specific override (highest priority)<br />
                                2. Engine default cost<br />
                                3. Global AI type default cost (lowest priority)
                              </p>
                              <p className="text-xs text-purple-400 mt-2">
                                Leave override fields empty to use engine default costs.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
           {/* Google Analytics Realtime */}
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                    <Globe className="w-6 h-6 text-indigo-400" /> Google Analytics Realtime
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Live active users and events</p>
                </div>
                <button 
                  onClick={fetchGoogleAnalyticsRealtime}
                  className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl text-xs font-bold text-indigo-400 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${gaLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {gaLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : gaError ? (
                <div className="h-32 flex items-center justify-center text-sm text-red-400 font-bold uppercase tracking-[0.15em] text-center">
                  {gaError}
                </div>
              ) : gaRealtime ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Active Users</p>
                    <h4 className="text-3xl font-black text-white mt-2">{gaRealtime.activeUsers}</h4>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Event Count</p>
                    <h4 className="text-3xl font-black text-white mt-2">{gaRealtime.eventCount}</h4>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Top Events</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {gaRealtime.events.slice(0,5).map((ev, idx) => (
                        <div key={ev.name + idx} className="flex items-center justify-between text-sm text-gray-200">
                          <span className="font-bold truncate pr-2">{ev.name}</span>
                          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{ev.count}</span>
                        </div>
                      ))}
                      {gaRealtime.events.length === 0 && <p className="text-xs text-gray-500">No events yet.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-gray-500 font-bold uppercase tracking-[0.15em] text-center">
                  Waiting for Google Analytics data...
                </div>
              )}
           </div>

           {/* Daily Traffic Volume Chart */}
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                    <Activity className="w-6 h-6 text-indigo-400" /> Daily Traffic Volume
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Last 14 Days</p>
                </div>
                <button 
                  onClick={fetchTraffic}
                  className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl text-xs font-bold text-indigo-400 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${trafficLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {trafficLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : dailyTraffic.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-64 flex items-end gap-2">
                    {dailyTraffic.map((d, i) => {
                      const maxVisits = Math.max(...dailyTraffic.map(t => t.visits), 1);
                      const height = (d.visits / maxVisits) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                          <div 
                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-2xl relative cursor-pointer transition-all hover:from-indigo-500 hover:to-indigo-300"
                            style={{ height: `${height}%`, minHeight: '8px' }}
                          >
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-dark-950 border border-indigo-600/40 text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl whitespace-nowrap z-10">
                              <div className="text-indigo-400 mb-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                              <div>{d.visits} visits</div>
                              <div className="text-gray-500 text-[9px]">{d.uniqueVisitors} unique</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
                            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Visits</div>
                      <div className="text-2xl font-black text-white">
                        {dailyTraffic.reduce((sum, d) => sum + d.visits, 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Avg Per Day</div>
                      <div className="text-2xl font-black text-indigo-400">
                        {Math.round(dailyTraffic.reduce((sum, d) => sum + d.visits, 0) / dailyTraffic.length).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Peak Day</div>
                      <div className="text-2xl font-black text-pink-400">
                        {Math.max(...dailyTraffic.map(d => d.visits)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Activity className="w-12 h-12 text-gray-700 mb-4" />
                  <p className="text-sm text-gray-500">No traffic data available yet.</p>
                  <p className="text-xs text-gray-600 mt-2">Visit tracking will begin once users start accessing the site.</p>
                </div>
              )}
           </div>

           {/* Firebase Analytics Integration */}
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-pink-400" /> Firebase Analytics
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
                </div>
                <button 
                  onClick={fetchFirebaseAnalytics}
                  className="px-4 py-2 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-600/20 rounded-xl text-xs font-bold text-pink-400 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {analyticsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                </div>
              ) : analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-600/20 rounded-xl">
                        <Eye className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Page Views</div>
                    </div>
                    <div className="text-3xl font-black text-white">{analyticsData.totalPageViews.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600 mt-2">Last 30 days</div>
                  </div>
                  
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-600/20 rounded-xl">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">New Users</div>
                    </div>
                    <div className="text-3xl font-black text-white">{analyticsData.newUsers.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600 mt-2">Registrations</div>
                  </div>
                  
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-600/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conversions</div>
                    </div>
                    <div className="text-3xl font-black text-white">{analyticsData.totalConversions.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-600 mt-2">Purchases</div>
                  </div>
                  
                  <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-pink-600/20 rounded-xl">
                        <Activity className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conversion Rate</div>
                    </div>
                    <div className="text-3xl font-black text-white">{analyticsData.conversionRate.toFixed(2)}%</div>
                    <div className="text-[10px] text-gray-600 mt-2">Performance</div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <BarChart3 className="w-12 h-12 text-gray-700 mb-4" />
                  <p className="text-sm text-gray-500">No analytics data available yet.</p>
                  <p className="text-xs text-gray-600 mt-2">Firebase Analytics will populate as users interact with the site.</p>
                </div>
              )}
           </div>

           {/* Generations Live */}
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                    <Zap className="w-6 h-6 text-amber-400" /> Generations Live
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Real-time multimodal activity (auto-refresh 5s)</p>
                </div>
                <button 
                  onClick={fetchLiveGenerationData}
                  className="px-4 py-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/20 rounded-xl text-xs font-bold text-amber-400 transition-all flex items-center gap-2"
                  disabled={liveGenLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${liveGenLoading ? 'animate-spin' : ''}`} />
                  {liveGenLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {liveGenStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[{
                    label: 'Total Generations',
                    value: liveGenStats.totalGenerations,
                    color: 'text-white',
                    badge: '7 days'
                  }, {
                    label: 'AI Images',
                    value: liveGenStats.imageCount,
                    color: 'text-indigo-400',
                    badge: 'Images'
                  }, {
                    label: 'AI Videos',
                    value: liveGenStats.videoCount,
                    color: 'text-purple-400',
                    badge: 'Videos'
                  }, {
                    label: 'AI Audio',
                    value: liveGenStats.audioCount,
                    color: 'text-pink-400',
                    badge: 'Audio'
                  }].map((card, idx) => (
                    <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl p-6 shadow-inner">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{card.label}</div>
                      <div className={`text-3xl font-black ${card.color}`}>{card.value?.toLocaleString?.() ?? 0}</div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">{card.badge}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-8 text-sm text-gray-500">No generation analytics yet.</div>
              )}

              {liveGenStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Success Rate</div>
                    <div className="text-3xl font-black text-green-400">{liveGenStats.successRate.toFixed(1)}%</div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Completed vs total</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Creators</div>
                    <div className="text-3xl font-black text-white">{liveGenStats.uniqueUsers}</div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-1">Unique users (7d)</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Top Users</div>
                    <div className="space-y-2">
                      {(liveGenStats.topUsers || []).slice(0,3).map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs text-gray-200">
                          <span className="truncate">{u.userName || 'Unknown'}</span>
                          <span className="text-gray-500 font-black">{u.count}</span>
                        </div>
                      ))}
                      {(liveGenStats.topUsers || []).length === 0 && (
                        <p className="text-[10px] text-gray-500 uppercase">No data</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-black/20 border border-white/5 rounded-[2rem]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Live Activity Feed</h4>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Last 50 generations</p>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
                  </div>
                </div>

                <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                  {liveGenLoading && liveGenerations.length === 0 ? (
                    <div className="py-16 flex items-center justify-center text-sm text-gray-500">
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading live generations...
                    </div>
                  ) : liveGenerations.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {liveGenerations.map((gen: any) => {
                        const isImage = gen.type === 'image';
                        const isVideo = gen.type === 'video';
                        const isAudio = gen.type === 'audio';

                        let badgeColor = 'bg-indigo-600/20 text-indigo-300';
                        if (isVideo) badgeColor = 'bg-purple-600/20 text-purple-300';
                        if (isAudio) badgeColor = 'bg-pink-600/20 text-pink-300';

                        const statusColor = gen.status === 'completed' ? 'text-green-400' : gen.status === 'failed' ? 'text-red-400' : 'text-amber-400';

                        return (
                          <div key={gen.id} className="p-5 hover:bg-white/5 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
                                  AI {gen.type?.toUpperCase?.()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-white truncate">{gen.userName || 'Unknown User'}</div>
                                  <div className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{gen.userEmail || 'no-email'}</div>
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">"{gen.prompt}"</p>
                                  {gen.engine && <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Engine: {gen.engine}</p>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{gen.status || 'processing'}</div>
                                <div className="text-[9px] text-gray-600 mt-1 whitespace-nowrap">{new Date(gen.timestamp).toLocaleTimeString()}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-sm text-gray-500">No live generations yet.</div>
                  )}
                </div>
              </div>
           </div>

           {/* Revenue and Geographic Data */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase italic mb-10 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-indigo-400" /> Growth Vectors</h3>
              <div className="h-64 flex items-end gap-3">
                 {MOCK_REVENUE_DATA.map((d, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-4">
                      <div className="w-full bg-indigo-500/20 rounded-t-2xl relative group cursor-pointer transition-all hover:bg-indigo-500/40" style={{ height: `${(d.amount / 6000) * 100}%` }}>
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">${d.amount}</div>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase">{d.month}</span>
                   </div>
                 ))}
              </div>
           </div>

                <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-3"><Globe className="w-6 h-6 text-pink-400" /> Geographic Nodes</h3>
              <div className="space-y-6">
                 {countries && countries.length > 0 ? countries.map((d, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-white">{d.country || 'Unknown'}</span>
                         <span className="text-gray-500">{d.count} Visits ({Math.round(d.percentage)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                         <div className="h-full bg-pink-500/40 transition-all duration-1000" style={{ width: `${d.percentage}%` }} />
                      </div>
                   </div>
                 )) : (
                   <div className="py-6 text-center text-xs text-gray-500">No traffic data yet. Visits will appear here once the site receives traffic (logs every page view).</div>
                 )}
              </div>

              <div className="pt-8 border-t border-white/5">
                 <h4 className="text-sm font-black uppercase text-gray-400 mb-4">Top Referrers</h4>
                 <div className="space-y-3">
                   {referrers && referrers.length > 0 ? referrers.map((r, i) => (
                     <div key={i} className="flex items-center justify-between text-[10px] font-black text-gray-300">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{r.referrer}</span>
                        </div>
                        <span className="text-gray-500 uppercase">{r.count} ({Math.round(r.percentage)}%)</span>
                     </div>
                   )) : (
                     <div className="text-xs text-gray-500">No referrer data available.</div>
                   )}
                 </div>
              </div>
           </div>
           </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8 animate-fade-in">
           {/* Enhanced Filter Bar */}
           <div className="bg-dark-900 border border-white/10 rounded-[2.5rem] p-8 shadow-xl flex flex-col lg:flex-row items-center gap-8">
              <div className="relative flex-1 group w-full">
                 <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery ? 'text-indigo-400' : 'text-gray-500'}`} />
                 <input 
                  type="text" 
                  placeholder="Scan by name, email, or user hash..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-12 text-sm text-white outline-none focus:border-indigo-500 transition-all shadow-inner" 
                 />
                 {searchQuery && (
                   <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 )}
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                 <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    {(['all', 'active', 'suspended'] as const).map(s => (
                      <button 
                        key={s} 
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-white'}`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
                 <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    {(['all', 'free', 'basic', 'premium'] as const).map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPlanFilter(p)}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${planFilter === p ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-gray-500 hover:text-white'}`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* User List Table */}
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-white/5 bg-black/20 flex items-center justify-between">
                 <div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">User Directory</h3>
                   <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">Audit and modify authorized system accounts</p>
                 </div>
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-white uppercase">{filteredUsers.length} Results</span>
                    {typeof onSyncFirebase === 'function' && (
                      <button onClick={async () => { try { await onSyncFirebase(); } catch (e) { alert('Sync failed'); } }} className="ml-4 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Sync Firebase</button>
                    )}
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">User Profile</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Email</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Plan</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Credits</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/5 group transition-colors">
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center font-black text-indigo-400 shadow-inner border border-white/5">
                                    {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-2xl" /> : u.name.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-white uppercase tracking-tight">{u.name}</p>
                                     <p className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-2">
                                       <span className="text-[8px] font-normal text-indigo-500/50">#{u.id.substring(0, 8)}</span>
                                     </p>
                                  </div>
                                </div>
                             </td>
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-3">
                                  <Mail className="w-4 h-4 text-indigo-400" />
                                    <p className="text-sm font-bold text-gray-300 break-all">{u.email || 'No email provided'}</p>
                                </div>
                             </td>
                             <td className="px-10 py-6">
                                <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.plan === 'premium' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                  {u.plan}
                                </span>
                             </td>
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm font-black text-white">{u.credits > 1000 ? '∞' : u.credits}</span>
                                </div>
                             </td>
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-2 h-2 rounded-full ${u.status === 'suspended' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${u.status === 'suspended' ? 'text-red-400' : 'text-gray-400'}`}>{u.status || 'active'}</span>
                                </div>
                             </td>
                             <td className="px-10 py-6">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => openUserDetail(u)} 
                                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2" 
                                     title="View Full Details"
                                   >
                                     <Eye className="w-3 h-3" /> Details
                                   </button>
                                   <button onClick={() => setEditingUser(u)} className="p-2 bg-white/5 hover:bg-indigo-600/10 text-indigo-400 rounded-xl border border-white/10 transition-all" title="Modify User"><Edit3 className="w-3 h-3" /></button>
                                   <button onClick={() => handleToggleUserStatus(u)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all" title="Toggle Suspend">
                                     {u.status === 'suspended' ? <UserCheck className="w-3 h-3 text-green-400" /> : <UserMinus className="w-3 h-3 text-red-400" />}
                                   </button>
                                   <button onClick={() => onDeleteUser(u.id)} className="p-2 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-xl border border-white/10 transition-all" title="Delete User"><Trash2 className="w-3 h-3" /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                       {filteredUsers.length === 0 && (
                         <tr>
                           <td colSpan={6} className="px-10 py-40 text-center">
                              <div className="flex flex-col items-center justify-center opacity-30 italic">
                                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10 text-gray-700" />
                                 </div>
                                 <h4 className="text-2xl font-black uppercase tracking-[0.2em] text-gray-500">Zero Matches</h4>
                                 <p className="text-[10px] font-bold uppercase mt-3 tracking-widest">The neural directory contains no nodes matching your current filter set.</p>
                                 <button 
                                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPlanFilter('all'); }}
                                  className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all"
                                 >
                                    Reset Filters
                                 </button>
                              </div>
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in h-[700px]">
           <div className="lg:col-span-1 bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Support Sessions</h3>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Email Linked</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                 {sessions.map(s => (
                   <button 
                    key={s.id} 
                    onClick={() => setActiveSessionId(s.id)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all group ${activeSessionId === s.id ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon className={`w-3.5 h-3.5 ${activeSessionId === s.id ? 'text-white' : 'text-indigo-400'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${activeSessionId === s.id ? 'text-white' : 'text-gray-300'}`}>{s.name}</span>
                        </div>
                        {s.isGuest && <span className={`text-[8px] font-black px-2 py-0.5 rounded ${activeSessionId === s.id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'}`}>GUEST</span>}
                      </div>
                      <p className={`text-[10px] truncate ${activeSessionId === s.id ? 'text-indigo-100' : 'text-gray-500'}`}>{s.email || 'No email associated'}</p>
                      <div className="flex justify-between items-center mt-4">
                         <span className={`text-[8px] font-bold ${activeSessionId === s.id ? 'text-indigo-200' : 'text-gray-600'}`}>{new Date(s.lastMessageAt).toLocaleTimeString()}</span>
                         <ChevronRight className={`w-3 h-3 transition-transform ${activeSessionId === s.id ? 'translate-x-1 text-white' : 'text-gray-700'}`} />
                      </div>
                   </button>
                 ))}
                 {sessions.length === 0 && <div className="py-20 text-center opacity-30 italic text-xs uppercase tracking-widest">No active sessions.</div>}
              </div>
           </div>

           <div className="lg:col-span-2 bg-dark-900 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col relative">
              {activeSession ? (
                <>
                  <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white">{activeSession.name.charAt(0)}</div>
                        <div>
                           <h4 className="text-sm font-black text-white uppercase tracking-tight">{activeSession.name}</h4>
                           <p className="text-[10px] text-gray-600 uppercase font-bold">{activeSession.id}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                           <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Dispatch Status</span>
                           <span className="text-[9px] font-bold text-green-500 uppercase">Watchdog Active</span>
                        </div>
                        <button onClick={fetchSessions} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"><RefreshCw className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-black/20 custom-scrollbar">
                     {activeSession.chatHistory.map((m: any) => (
                       <div key={m.id} className={`flex ${m.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-5 rounded-3xl shadow-xl leading-relaxed ${m.sender === 'support' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-dark-800 text-gray-300 border border-white/5 rounded-tl-none'}`}>
                             <p className="text-xs font-medium">{m.text}</p>
                             <p className={`text-[8px] mt-2 opacity-50 font-black uppercase tracking-widest ${m.sender === 'support' ? 'text-right' : 'text-left'}`}>{new Date(m.timestamp).toLocaleTimeString()}</p>
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="p-6 border-t border-white/5 bg-dark-900">
                     <div className="relative">
                        <textarea 
                          value={replyText} 
                          onChange={e => setReplyText(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSupportReply())}
                          placeholder="Compose reply payload..." 
                          className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] py-4 pl-6 pr-20 text-xs text-white outline-none focus:border-indigo-500 resize-none h-24" 
                        />
                        <button 
                          onClick={handleSupportReply} 
                          disabled={isReplying || !replyText.trim()}
                          className="absolute right-4 bottom-4 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl transition-all disabled:opacity-30"
                        >
                           {isReplying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20">
                   <MessageSquare className="w-20 h-20 mb-6" />
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter">Terminal Awaiting Signal</h3>
                   <p className="text-sm mt-2 uppercase tracking-widest font-bold">Select a support session to initialize terminal</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="max-w-3xl mx-auto animate-fade-in">
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="flex items-center gap-6 mb-12 relative z-10">
                 <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30"><Bell className="w-10 h-10 text-white" /></div>
                 <div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Global Transmit</h3>
                    <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">Inter-Node Communication Protocol</p>
                 </div>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Protocol Subject</label>
                    <input 
                      type="text" 
                      placeholder="e.g. System Maintenance Scheduled" 
                      value={broadcastData.subject}
                      onChange={e => setBroadcastData({...broadcastData, subject: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payload Content</label>
                    <textarea 
                      placeholder="Compose global announcement..." 
                      value={broadcastData.content}
                      onChange={e => setBroadcastData({...broadcastData, content: e.target.value})}
                      className="w-full h-44 bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white text-lg outline-none resize-none" 
                    />
                 </div>
                 <button 
                  onClick={handleBroadcast} 
                  disabled={isBroadcasting || !broadcastData.subject || !broadcastData.content}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                 >
                    {isBroadcasting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isBroadcasting ? 'Broadcasting...' : 'Dispatch Protocol'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="p-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30"><Key className="w-10 h-10 text-white" /></div>
                    <div>
                       <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Neural Link</h3>
                       <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em]">High-Tier Gemini Provisioning</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${hasApiKey ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                       <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{hasApiKey ? 'Link Active' : 'No Link Found'}</span>
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
                 <div className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] flex flex-col justify-between">
                    <div>
                       <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2"><VideoIcon className="w-5 h-5 text-indigo-400" /> TTV Moteur Status</h4>
                       <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-8">The Text-To-Video engine requires a paid API Key with Sora 2 capabilities. Bonding a key here enables production for all registered nodes.</p>
                    </div>
                    <button onClick={onSelectKey} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3">
                       <ShieldCheck className="w-4 h-4" /> {hasApiKey ? 'Update Auth Token' : 'Authorize TTV Moteur'}
                    </button>
                 </div>
                 <div className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] flex flex-col justify-between">
                    <div>
                       <h4 className="text-lg font-black text-white uppercase italic mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-pink-400" /> Connection Test</h4>
                       <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-8">Perform a neural handshake to verify the current API key's throughput and access permissions across all modalities.</p>
                    </div>
                    <button onClick={handleTestEngine} disabled={isVerifying} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                       {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                       {isVerifying ? 'Pinging Node...' : 'Verify Engine Link'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CREDIT SYSTEM TAB */}
      {activeTab === 'credits' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Credit Configuration */}
          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic">Credit Configuration</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Set cost per AI feature</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setSavingConfig(true);
                  try {
                    const { updateCreditConfig: updateConfigFn } = await import('../services/firebase');
                    const user = await import('../services/firebase').then(m => m.auth.currentUser);
                    if (user) {
                      await updateConfigFn(creditConfig, user.uid, user.email || 'admin');
                      alert('✅ Credit configuration saved successfully!');
                    }
                  } catch (err: any) {
                    alert('❌ Failed to save config: ' + err.message);
                  } finally {
                    setSavingConfig(false);
                  }
                }}
                disabled={savingConfig}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? 'Saving...' : 'Save Config'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Image Generation Cost</label>
                <input 
                  type="number" 
                  value={creditConfig.imageCost}
                  onChange={e => setCreditConfig({...creditConfig, imageCost: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Credits per image</p>
              </div>

              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Video Cost (per second)</label>
                <input 
                  type="number" 
                  value={creditConfig.videoCostPerSecond}
                  onChange={e => setCreditConfig({...creditConfig, videoCostPerSecond: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Credits per second</p>
              </div>

              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Voice Cost (per minute)</label>
                <input 
                  type="number" 
                  value={creditConfig.voiceCostPerMinute}
                  onChange={e => setCreditConfig({...creditConfig, voiceCostPerMinute: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Credits per minute</p>
              </div>

              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Chat Cost (per token)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={creditConfig.chatCostPerToken}
                  onChange={e => setCreditConfig({...creditConfig, chatCostPerToken: parseFloat(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Credits per token</p>
              </div>

              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Free Signup Credits</label>
                <input 
                  type="number" 
                  value={creditConfig.freeSignupCredits}
                  onChange={e => setCreditConfig({...creditConfig, freeSignupCredits: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Initial credit grant</p>
              </div>

              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Premium Plan Credits</label>
                <input 
                  type="number" 
                  value={creditConfig.premiumPlanCredits}
                  onChange={e => setCreditConfig({...creditConfig, premiumPlanCredits: parseInt(e.target.value) || 0})}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-600 mt-2">Monthly allocation</p>
              </div>
            </div>
          </div>

          {/* Global Credit Stats */}
          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-pink-600 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic">Global Usage Stats</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Last 30 days</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  setCreditLoading(true);
                  try {
                    const stats = await getGlobalCreditStats(30);
                    setCreditStats(stats);
                  } catch (err) {
                    console.error('Failed to load credit stats:', err);
                  } finally {
                    setCreditLoading(false);
                  }
                }}
                className="px-4 py-2 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-600/20 rounded-xl text-xs font-bold text-pink-400 transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${creditLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {creditLoading ? (
              <div className="py-20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : creditStats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Credits Used</p>
                    <h4 className="text-3xl font-black text-white">{creditStats.totalCreditsUsed.toLocaleString()}</h4>
                  </div>
                  <div className="p-6 bg-green-600/10 border border-green-600/20 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Generations</p>
                    <h4 className="text-3xl font-black text-white">{creditStats.totalGenerations.toLocaleString()}</h4>
                  </div>
                  <div className="p-6 bg-pink-600/10 border border-pink-600/20 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Avg Cost Per Gen</p>
                    <h4 className="text-3xl font-black text-white">
                      {creditStats.totalGenerations > 0 ? (creditStats.totalCreditsUsed / creditStats.totalGenerations).toFixed(1) : '0'}
                    </h4>
                  </div>
                  <div className="p-6 bg-purple-600/10 border border-purple-600/20 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Users</p>
                    <h4 className="text-3xl font-black text-white">{creditStats.byUser.length}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                    <h4 className="text-sm font-black text-white uppercase mb-4">Usage By Type</h4>
                    <div className="space-y-3">
                      {Object.entries(creditStats.byType).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center gap-3">
                            {type === 'image' && <ImageIcon className="w-4 h-4 text-green-400" />}
                            {type === 'video' && <VideoIcon className="w-4 h-4 text-indigo-400" />}
                            {type === 'voice' && <Mic2 className="w-4 h-4 text-pink-400" />}
                            {type === 'chat' && <MessageSquare className="w-4 h-4 text-purple-400" />}
                            <span className="text-xs font-bold text-white capitalize">{type}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">{data.credits.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500">{data.count} generations</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-black/40 border border-white/10 rounded-2xl">
                    <h4 className="text-sm font-black text-white uppercase mb-4">Top Users</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {creditStats.byUser.slice(0, 10).map((user: any, idx: number) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gray-600">#{idx + 1}</span>
                            <span className="text-xs text-white font-medium truncate max-w-[150px]">{user.userEmail}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-indigo-400">{user.totalCredits.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-600">{user.generationCount} gens</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <BarChart3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Click Refresh to load statistics</p>
              </div>
            )}
          </div>

          {/* AI ENGINE PRICING MANAGEMENT */}
          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-purple-600 rounded-2xl">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic">AI Engine Pricing</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage cost per engine dynamically</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={async () => {
                    setEngineLoading(true);
                    try {
                      const { getAllEngines, getEngineStats } = await import('../services/firebase');
                      const allEngines = await getAllEngines();
                      setEngines(allEngines);
                      const engStats = await getEngineStats(undefined, 30);
                      setEngineStats(engStats);
                    } catch (err) {
                      console.error('Failed to load engines:', err);
                    } finally {
                      setEngineLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 rounded-xl text-xs font-bold text-purple-400 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${engineLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={() => {
                    setEditingEngine({
                      id: '',
                      engine_name: '',
                      ai_type: 'image',
                      is_active: true,
                      base_cost: 1,
                      cost_unit: 'image',
                      description: '',
                      created_at: Date.now(),
                      updated_at: Date.now()
                    });
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Engine
                </button>
              </div>
            </div>

            {engineLoading ? (
              <div className="py-20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : engines.length > 0 ? (
              <>
                {/* Engine Stats Summary */}
                {engineStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 bg-purple-600/10 border border-purple-600/20 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Engines</p>
                      <h4 className="text-3xl font-black text-white">{engines.length}</h4>
                    </div>
                    <div className="p-6 bg-green-600/10 border border-green-600/20 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Engines</p>
                      <h4 className="text-3xl font-black text-white">{engines.filter(e => e.is_active).length}</h4>
                    </div>
                    <div className="p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Usage (30d)</p>
                      <h4 className="text-3xl font-black text-white">{engineStats.totalUsage.toLocaleString()}</h4>
                    </div>
                    <div className="p-6 bg-pink-600/10 border border-pink-600/20 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Success Rate</p>
                      <h4 className="text-3xl font-black text-white">{engineStats.successRate.toFixed(1)}%</h4>
                    </div>
                  </div>
                )}

                {/* Engines Table Grouped by AI Type */}
                {['image', 'video', 'voice', 'chat'].map(aiType => {
                  const typeEngines = engines.filter(e => e.ai_type === aiType);
                  if (typeEngines.length === 0) return null;

                  return (
                    <div key={aiType} className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        {aiType === 'image' && <ImageIcon className="w-5 h-5 text-green-400" />}
                        {aiType === 'video' && <VideoIcon className="w-5 h-5 text-indigo-400" />}
                        {aiType === 'voice' && <Mic2 className="w-5 h-5 text-pink-400" />}
                        {aiType === 'chat' && <MessageSquare className="w-5 h-5 text-purple-400" />}
                        <h4 className="text-lg font-black text-white uppercase">{aiType} Engines</h4>
                      </div>

                      <div className="space-y-3">
                        {typeEngines.map(engine => {
                          const engStat = engineStats?.byEngine?.find((s: any) => s.engine_id === engine.id);
                          
                          return (
                            <div key={engine.id} className="p-5 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-all">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${
                                    engine.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                                  }`}>
                                    {engine.is_active ? 'Active' : 'Disabled'}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-sm font-bold text-white mb-1">{engine.engine_name}</h5>
                                    <p className="text-[10px] text-gray-500">{engine.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  {/* Cost */}
                                  <div className="text-center">
                                    <p className="text-[10px] text-gray-500 uppercase mb-1">Cost</p>
                                    <p className="text-lg font-black text-indigo-400">{engine.base_cost}</p>
                                    <p className="text-[10px] text-gray-600">per {engine.cost_unit}</p>
                                  </div>

                                  {/* Stats */}
                                  {engStat && (
                                    <div className="text-center">
                                      <p className="text-[10px] text-gray-500 uppercase mb-1">Usage (30d)</p>
                                      <p className="text-lg font-black text-green-400">{engStat.total_usage_count}</p>
                                      <p className="text-[10px] text-gray-600">{engStat.success_rate.toFixed(0)}% success</p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setEditingEngine(engine)}
                                      className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg transition-all"
                                      title="Edit Engine"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (confirm(`${engine.is_active ? 'Disable' : 'Enable'} ${engine.engine_name}?`)) {
                                          try {
                                            const { updateEngineStatus } = await import('../services/firebase');
                                            await updateEngineStatus(engine.id, !engine.is_active);
                                            // Reload engines
                                            const { getAllEngines } = await import('../services/firebase');
                                            const allEngines = await getAllEngines();
                                            setEngines(allEngines);
                                          } catch (err: any) {
                                            alert('❌ Failed to update engine: ' + err.message);
                                          }
                                        }
                                      }}
                                      className={`p-2 ${engine.is_active ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400' : 'bg-green-600/20 hover:bg-green-600/40 text-green-400'} rounded-lg transition-all`}
                                      title={engine.is_active ? 'Disable' : 'Enable'}
                                    >
                                      {engine.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="py-20 text-center">
                <Layers className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">No engines configured yet</p>
                <button 
                  onClick={() => {
                    setEditingEngine({
                      id: '',
                      engine_name: '',
                      ai_type: 'image',
                      is_active: true,
                      base_cost: 1,
                      cost_unit: 'image',
                      description: '',
                      created_at: Date.now(),
                      updated_at: Date.now()
                    });
                  }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add First Engine
                </button>
              </div>
            )}
          </div>

          {/* Engine Editor Modal */}
          {editingEngine && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-dark-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-white uppercase">{editingEngine.id ? 'Edit' : 'Add'} Engine</h3>
                  <button onClick={() => setEditingEngine(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Engine ID</label>
                    <input 
                      type="text" 
                      value={editingEngine.id}
                      onChange={e => setEditingEngine({...editingEngine, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                      disabled={!!editingEngine.created_at && editingEngine.id}
                      placeholder="e.g., dalle, gemini, seddream"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">Unique identifier (lowercase, no spaces)</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Engine Name</label>
                    <input 
                      type="text" 
                      value={editingEngine.engine_name}
                      onChange={e => setEditingEngine({...editingEngine, engine_name: e.target.value})}
                      placeholder="e.g., DALL-E 3, Gemini Pro"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">AI Type</label>
                      <select 
                        value={editingEngine.ai_type}
                        onChange={e => setEditingEngine({...editingEngine, ai_type: e.target.value})}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="voice">Voice</option>
                        <option value="chat">Chat</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Status</label>
                      <select 
                        value={editingEngine.is_active ? 'active' : 'inactive'}
                        onChange={e => setEditingEngine({...editingEngine, is_active: e.target.value === 'active'})}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Base Cost</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingEngine.base_cost}
                        onChange={e => setEditingEngine({...editingEngine, base_cost: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Cost Unit</label>
                      <select 
                        value={editingEngine.cost_unit}
                        onChange={e => setEditingEngine({...editingEngine, cost_unit: e.target.value})}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500"
                      >
                        <option value="image">Per Image</option>
                        <option value="second">Per Second</option>
                        <option value="minute">Per Minute</option>
                        <option value="token">Per Token</option>
                        <option value="message">Per Message</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                    <textarea 
                      value={editingEngine.description}
                      onChange={e => setEditingEngine({...editingEngine, description: e.target.value})}
                      rows={3}
                      placeholder="Describe this engine..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button 
                      onClick={async () => {
                        try {
                          if (!editingEngine.id || !editingEngine.engine_name) {
                            alert('❌ Please fill in required fields');
                            return;
                          }

                          const { setEngine, getAllEngines } = await import('../services/firebase');
                          await setEngine(editingEngine.id, {
                            engine_name: editingEngine.engine_name,
                            ai_type: editingEngine.ai_type,
                            is_active: editingEngine.is_active,
                            base_cost: editingEngine.base_cost,
                            cost_unit: editingEngine.cost_unit,
                            description: editingEngine.description,
                            created_at: editingEngine.created_at || Date.now()
                          });

                          // Reload engines
                          const allEngines = await getAllEngines();
                          setEngines(allEngines);
                          setEditingEngine(null);
                          alert('✅ Engine saved successfully!');
                        } catch (err: any) {
                          alert('❌ Failed to save engine: ' + err.message);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Engine
                    </button>
                    <button 
                      onClick={() => setEditingEngine(null)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIVE AI ACTIVITY TAB */}
      {activeTab === 'live-ai' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Real-time Activity Stream */}
          <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-600 rounded-2xl">
                  <Activity className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic">Live AI Activity</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Real-time monitoring via Firestore</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-600/20 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live</span>
                </div>
                <button 
                  onClick={async () => {
                    setAiActivityLoading(true);
                    try {
                      const activities = await getAIActivity(100);
                      setAiActivities(activities);
                    } catch (err) {
                      console.error('Failed to load AI activities:', err);
                    } finally {
                      setAiActivityLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 rounded-xl text-xs font-bold text-green-400 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${aiActivityLoading ? 'animate-spin' : ''}`} />
                  Manual Refresh
                </button>
              </div>
            </div>

            {aiActivityLoading ? (
              <div className="py-20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : aiActivities.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {aiActivities.map((activity: any) => (
                  <div key={activity.id} className="p-5 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${
                          activity.aiType === 'image' ? 'bg-green-600/20 text-green-400' :
                          activity.aiType === 'video' ? 'bg-indigo-600/20 text-indigo-400' :
                          activity.aiType === 'voice' ? 'bg-pink-600/20 text-pink-400' :
                          'bg-purple-600/20 text-purple-400'
                        }`}>
                          {activity.aiType === 'image' && <ImageIcon className="w-5 h-5" />}
                          {activity.aiType === 'video' && <VideoIcon className="w-5 h-5" />}
                          {activity.aiType === 'voice' && <Mic2 className="w-5 h-5" />}
                          {activity.aiType === 'chat' && <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-bold text-white">{activity.userName || 'Unknown User'}</span>
                            <span className="text-[10px] text-gray-600">{activity.userEmail}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 truncate">{activity.prompt}</p>
                          <div className="flex items-center gap-4 text-[10px] text-gray-600">
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {activity.creditsUsed} credits
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                            {activity.country && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {activity.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${
                          activity.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                          activity.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                          activity.status === 'processing' ? 'bg-indigo-600/20 text-indigo-400 animate-pulse' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {activity.status}
                        </div>
                        {activity.processingTime && (
                          <p className="text-[10px] text-gray-600 mt-2">{(activity.processingTime / 1000).toFixed(1)}s</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Activity className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No AI activity recorded yet</p>
              </div>
            )}
          </div>

          {/* Abuse Detection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-black text-white uppercase italic">Abuse Detection</h3>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const logs = await getAbuseDetectionLogs(50);
                      setAbuseDetections(logs);
                    } catch (err) {
                      console.error('Failed to load abuse logs:', err);
                    }
                  }}
                  className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-lg text-[10px] font-bold text-red-400 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {abuseDetections.length > 0 ? abuseDetections.map((abuse: any) => (
                  <div key={abuse.id} className="p-4 bg-red-600/5 border border-red-600/20 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-white">{abuse.userEmail}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                        abuse.severity === 'critical' ? 'bg-red-600/20 text-red-400' :
                        abuse.severity === 'high' ? 'bg-orange-600/20 text-orange-400' :
                        abuse.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {abuse.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">{abuse.description}</p>
                    <p className="text-[10px] text-gray-600">{new Date(abuse.timestamp).toLocaleString()}</p>
                  </div>
                )) : (
                  <div className="py-12 text-center">
                    <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-xs text-gray-500">No abuse detected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-xl font-black text-white uppercase italic">Admin Audit Log</h3>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const logs = await getAdminAuditLogs(50);
                      setAuditLogs(logs);
                    } catch (err) {
                      console.error('Failed to load audit logs:', err);
                    }
                  }}
                  className="px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-lg text-[10px] font-bold text-indigo-400 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {auditLogs.length > 0 ? auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 bg-indigo-600/5 border border-indigo-600/20 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-white">{log.adminEmail}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-indigo-600/20 text-indigo-400">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">{log.details}</p>
                    <p className="text-[10px] text-gray-600">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                )) : (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-xs text-gray-500">No audit logs yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cms' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
           <div className="lg:col-span-1 space-y-2">
              {[
                { id: 'general', label: 'Identity & SEO', icon: Globe },
                { id: 'landing', label: 'Landing Matrix', icon: Layout },
                { id: 'plans', label: 'Pricing Logic', icon: CreditCard },
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setCmsTab(tab.id as any)} 
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${cmsTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-dark-900 border border-white/5 text-gray-400 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3"><tab.icon className="w-4 h-4" />{tab.label}</div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${cmsTab === tab.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
              <div className="pt-10">
                 <button onClick={handleCommitCMS} className="w-full py-5 bg-green-600 hover:bg-green-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3">
                    <Save className="w-4 h-4" /> Commit Matrix
                 </button>
              </div>
           </div>

           <div className="lg:col-span-3">
              <div className="bg-dark-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-10">
                 
                 {cmsTab === 'general' && (
                   <div className="space-y-8 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <Globe className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">System Identity</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Title</label>
                            <input 
                              type="text" 
                              value={localConfig.seo.title} 
                              onChange={e => handleUpdateLocalConfig('seo', { ...localConfig.seo, title: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-indigo-500" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo Resource URL</label>
                            <input 
                              type="text" 
                              value={localConfig.logoUrl || ''} 
                              onChange={e => handleUpdateLocalConfig('logoUrl', e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-indigo-500" 
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SEO Descriptor</label>
                         <textarea 
                           value={localConfig.seo.description} 
                           onChange={e => handleUpdateLocalConfig('seo', { ...localConfig.seo, description: e.target.value })}
                           className="w-full h-32 bg-black/40 border border-white/10 rounded-[1.5rem] p-6 text-xs text-white outline-none resize-none focus:border-indigo-500" 
                         />
                      </div>
                   </div>
                 )}

                 {cmsTab === 'landing' && (
                   <div className="space-y-12 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <Layout className="w-6 h-6 text-pink-400" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Landing Matrix</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hero Projection Headline</label>
                           <input 
                             type="text" 
                             value={localConfig.heroTitle} 
                             onChange={e => handleUpdateLocalConfig('heroTitle', e.target.value)}
                             className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white outline-none focus:border-indigo-500" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hero Sub-Protocol Text</label>
                           <textarea 
                             value={localConfig.heroSubtitle} 
                             onChange={e => handleUpdateLocalConfig('heroSubtitle', e.target.value)}
                             className="w-full h-32 bg-black/40 border border-white/10 rounded-[1.5rem] p-6 text-xs text-white outline-none resize-none focus:border-indigo-500" 
                         />
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 block">Showcase Gallery Array (URLs)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {localConfig.showcaseImages.map((img, i) => (
                             <div key={i} className="aspect-square bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => handleUpdateLocalConfig('showcaseImages', localConfig.showcaseImages.filter((_, idx) => idx !== i))}
                                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                           ))}
                           <button onClick={() => {
                             const url = prompt("Enter Image URL:");
                             if (url) handleUpdateLocalConfig('showcaseImages', [...localConfig.showcaseImages, url]);
                           }} className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white hover:border-indigo-500 transition-all">
                              <Plus className="w-6 h-6" />
                           </button>
                        </div>
                      </div>
                   </div>
                 )}

                 {cmsTab === 'plans' && (
                   <div className="space-y-8 animate-fade-in">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-6 h-6 text-amber-500" />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Monetization Logic</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {localConfig.plans.map((plan, i) => (
                           <div key={i} className="p-8 bg-black/40 border border-white/10 rounded-[2rem] space-y-6 relative overflow-hidden group">
                              <div className="flex justify-between items-start">
                                 <input 
                                   type="text" 
                                   value={plan.name} 
                                   onChange={e => {
                                      const newPlans = [...localConfig.plans];
                                      newPlans[i].name = e.target.value;
                                      handleUpdateLocalConfig('plans', newPlans);
                                   }}
                                   className="bg-transparent border-none text-white font-black uppercase text-xs p-0 outline-none w-2/3" 
                                 />
                                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              </div>
                              <div className="flex items-baseline gap-1">
                                 <span className="text-gray-500 text-[10px] uppercase font-black">$</span>
                                 <input 
                                   type="text" 
                                   value={plan.price.replace('$', '')} 
                                   onChange={e => {
                                      const newPlans = [...localConfig.plans];
                                      newPlans[i].price = `$${e.target.value}`;
                                      handleUpdateLocalConfig('plans', newPlans);
                                   }}
                                   className="bg-transparent border-none text-white font-black text-2xl p-0 outline-none w-1/2" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[8px] font-black text-gray-600 uppercase">Monthly Quota</label>
                                 <input 
                                   type="text" 
                                   value={plan.credits} 
                                   onChange={e => {
                                      const newPlans = [...localConfig.plans];
                                      newPlans[i].credits = e.target.value as any;
                                      handleUpdateLocalConfig('plans', newPlans);
                                   }}
                                   className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black text-amber-500 outline-none" 
                                 />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

              </div>
           </div>
        </div>
      )}

      {/* MODAL: User Node Modify */}
      {editingUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-dark-950/95 backdrop-blur-3xl animate-fade-in">
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
              <div className="p-10 border-b border-white/5 bg-black/20 flex justify-between items-center relative z-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 rounded-2xl"><Edit3 className="w-6 h-6 text-white" /></div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Modify System User</h3>
                 </div>
                 <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 text-gray-500 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-10 space-y-8 relative z-10">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Display Name</label>
                       <input 
                        type="text" 
                        value={editingUser.name} 
                        onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identity Email</label>
                       <input 
                        type="email" 
                        value={editingUser.email} 
                        onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Protocol (Plan)</label>
                       <select 
                        value={editingUser.plan}
                        onChange={e => setEditingUser({...editingUser, plan: e.target.value as any})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                       >
                         <option value="free">Free Trial</option>
                         <option value="basic">Basic Creator</option>
                         <option value="premium">Premium Suite</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Compute Units (Credits)</label>
                       <input 
                        type="number" 
                        value={editingUser.credits} 
                        onChange={e => setEditingUser({...editingUser, credits: parseInt(e.target.value) || 0})} 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500" 
                       />
                    </div>
                    <div className="space-y-2 col-span-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Authorization Status</label>
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setEditingUser({...editingUser, status: 'active'})}
                            className={`py-4 rounded-2xl font-black uppercase text-[10px] border transition-all ${editingUser.status !== 'suspended' ? 'bg-green-600/20 border-green-500 text-green-400 shadow-lg shadow-green-600/10' : 'bg-black/40 border-white/5 text-gray-600 hover:border-white/20'}`}
                          >
                            Active Node
                          </button>
                          <button 
                            onClick={() => setEditingUser({...editingUser, status: 'suspended'})}
                            className={`py-4 rounded-2xl font-black uppercase text-[10px] border transition-all ${editingUser.status === 'suspended' ? 'bg-red-600/20 border-red-500 text-red-400 shadow-lg shadow-red-600/10' : 'bg-black/40 border-white/5 text-gray-600 hover:border-white/20'}`}
                          >
                            Suspended Node
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-white/5 flex gap-4">
                    <button 
                      onClick={() => setEditingUser(null)} 
                      className="flex-1 py-4 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                    >
                      Cancel Changes
                    </button>
                    <button 
                      onClick={() => { onUpdateUser(editingUser); setEditingUser(null); }}
                      className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Commit Sync
                    </button>
                 </div>
              </div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
           </div>
        </div>
      )}

      {/* MODAL: User Detail with Advanced Management */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-dark-950/95 backdrop-blur-3xl animate-fade-in overflow-y-auto">
           <div className="bg-dark-900 border border-white/10 rounded-[3rem] w-full max-w-6xl overflow-hidden shadow-2xl relative my-8">
              <div className="p-10 border-b border-white/5 bg-black/20 flex justify-between items-center relative z-10">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 rounded-2xl"><UserIcon className="w-6 h-6 text-white" /></div>
                   <div>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selectedUser.name}</h3>
                     <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">{selectedUser.email}</p>
                   </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 text-gray-500 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-10 space-y-8 relative z-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 
                 {/* User Info Card */}
                 <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <h4 className="text-lg font-black text-white uppercase italic mb-6 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-indigo-400" /> User Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">User ID</div>
                        <div className="text-sm font-bold text-white">#{selectedUser.id.substring(0, 12)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email</div>
                        <div className="text-sm font-bold text-white break-words">{selectedUser.email || 'No email on record'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Plan</div>
                        <div className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase ${selectedUser.plan === 'premium' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                          {selectedUser.plan}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Credits</div>
                        <div className="text-sm font-black text-amber-500 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> {selectedUser.credits}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status</div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase ${selectedUser.status === 'suspended' ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}`}>
                          <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'suspended' ? 'bg-red-500' : 'bg-green-500'}`} />
                          {selectedUser.status || 'active'}
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Add Credits Section */}
                 <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <h4 className="text-lg font-black text-white uppercase italic mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" /> Credit Management
                    </h4>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Credit Amount</label>
                        <input 
                          type="number" 
                          value={creditAmount}
                          onChange={e => setCreditAmount(parseInt(e.target.value) || 0)}
                          placeholder="Enter amount..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-amber-500"
                        />
                      </div>
                      <button 
                        onClick={handleAddCredits}
                        disabled={addingCredits || creditAmount <= 0}
                        className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                      >
                        {addingCredits ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Grant Credits
                      </button>
                    </div>
                 </div>

                 {/* Send Email Section */}
                 <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <h4 className="text-lg font-black text-white uppercase italic mb-6 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-indigo-400" /> Send Email
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Subject</label>
                        <input 
                          type="text"
                          value={emailData.subject}
                          onChange={e => setEmailData({...emailData, subject: e.target.value})}
                          placeholder="Email subject..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Message</label>
                        <textarea 
                          value={emailData.content}
                          onChange={e => setEmailData({...emailData, content: e.target.value})}
                          placeholder="Email content..."
                          className="w-full h-32 bg-black/40 border border-white/10 rounded-[1.5rem] px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>
                      <button 
                        onClick={handleSendEmail}
                        disabled={sendingEmail || !emailData.subject || !emailData.content}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send Email
                      </button>
                    </div>
                 </div>

                 {/* IP Address Logs */}
                 <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-pink-400" /> IP Address Logs
                      </h4>
                      <button 
                        onClick={() => fetchUserIPLogs(selectedUser.id)}
                        className="px-4 py-2 bg-pink-600/10 hover:bg-pink-600/20 border border-pink-600/20 rounded-xl text-xs font-bold text-pink-400 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingIPLogs ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                    
                    {loadingIPLogs ? (
                      <div className="py-12 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                      </div>
                    ) : userIPLogs.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {userIPLogs.map((log: any, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-pink-600/20 rounded-lg">
                                <MapPin className="w-4 h-4 text-pink-400" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-white">{log.ipAddress}</div>
                                <div className="text-[10px] text-gray-600">
                                  {new Date(log.timestamp).toLocaleString()} • {log.location || 'Unknown Location'}
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleBlockIP(log.ipAddress)}
                              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-[9px] font-black uppercase text-red-400 transition-all flex items-center gap-2"
                            >
                              <Ban className="w-3 h-3" /> Block IP
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <MapPin className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No IP logs recorded yet.</p>
                      </div>
                    )}
                 </div>

                 {/* Blocked IPs */}
                 <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                        <Ban className="w-5 h-5 text-red-400" /> Blocked IP Addresses
                      </h4>
                      <button 
                        onClick={fetchBlockedIPs}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 rounded-xl text-xs font-bold text-red-400 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingBlockedIPs ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                    
                    {loadingBlockedIPs ? (
                      <div className="py-12 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                      </div>
                    ) : blockedIPs.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {blockedIPs.map((ip: any, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-red-600/5 rounded-xl border border-red-600/20 hover:bg-red-600/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-red-600/20 rounded-lg">
                                <Ban className="w-4 h-4 text-red-400" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-white">{ip.ipAddress}</div>
                                <div className="text-[10px] text-gray-600">{ip.reason || 'No reason provided'}</div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleUnblockIP(ip.ipAddress)}
                              className="px-4 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 rounded-xl text-[9px] font-black uppercase text-green-400 transition-all flex items-center gap-2"
                            >
                              <Check className="w-3 h-3" /> Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No blocked IP addresses.</p>
                      </div>
                    )}
                 </div>

              </div>
              
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      </div>
    </div>
  );
  } catch (error) {
    console.error('❌ [AdminDashboard] RENDER ERROR:', error);
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(to bottom, #1f2937 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          background: '#111827',
          padding: '2rem',
          borderRadius: '1rem',
          border: '1px solid #374151'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>⚠️ AdminDashboard Error</h2>
          <p style={{ marginBottom: '1rem', color: '#d1d5db' }}>An error occurred while rendering the admin dashboard:</p>
          <pre style={{
            background: '#1f2937',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            color: '#f87171',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {String(error)}
          </pre>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Check browser console for more details.</p>
        </div>
      </div>
    );
  }
};
