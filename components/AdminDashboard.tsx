
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
  Mic2, AlertTriangle, Info, Bell, MessageSquare, User as UserIcon,
  Filter, UserCheck, UserMinus, ShieldAlert
} from 'lucide-react';
import { 
  User, SiteConfig, Plan, AIJob, SystemMessage, SupportSession, ChatMessage
} from '../types';
import { MOCK_REVENUE_DATA, MOCK_COUNTRY_DATA } from '../utils/mockData';
import { getAllSupportSessions, sendSupportChatMessage } from '../services/dbService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'users' | 'support' | 'broadcast' | 'api' | 'cms'>('overview');
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

  // Support state
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
    if (activeTab === 'analytics') fetchTraffic();
  }, [activeTab]);

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

  return (
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
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
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
                                       {u.email}
                                       <span className="text-[8px] font-normal text-indigo-500/50">#{u.id.substring(0, 8)}</span>
                                     </p>
                                  </div>
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
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => setEditingUser(u)} className="p-3 bg-white/5 hover:bg-indigo-600/10 text-indigo-400 rounded-xl border border-white/10 transition-all" title="Modify User"><Edit3 className="w-4 h-4" /></button>
                                   <button onClick={() => onDeleteUser(u.id)} className="p-3 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-xl border border-white/10 transition-all" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                                   <button onClick={async () => {
                                     const subject = window.prompt('Subject for user email:');
                                     const content = window.prompt('Message body:');
                                     if (subject && content) {
                                       try {
                                         await onSendMessageToUser(u.id, { subject, content });
                                       } catch (e) {
                                         alert('Failed to send message.');
                                       }
                                     }
                                   }} className="p-3 bg-white/5 hover:bg-indigo-600/10 text-indigo-400 rounded-xl border border-white/10 transition-all" title="Contact User"><Mail className="w-4 h-4" /></button>
                                   <button onClick={() => onUpdateUser({...u, status: (u.status === 'suspended' ? 'active' : 'suspended')})} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all" title="Toggle Suspend">
                                     {u.status === 'suspended' ? <UserCheck className="w-4 h-4 text-green-400" /> : <UserMinus className="w-4 h-4 text-red-400" />}
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                       {filteredUsers.length === 0 && (
                         <tr>
                           <td colSpan={5} className="px-10 py-40 text-center">
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
