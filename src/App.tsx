import { useEffect, useState } from 'react';
import { Activity, CheckCircle, XCircle, Search, Sparkles, ExternalLink, Clock, Settings } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  permalink: string;
  selftext: string;
  created_utc: number;
  savedAt: string;
  pitch?: {
    dmMessage: string;
    replyMessage: string;
  };
}

interface PostsData {
  all: Post[];
  matched: Post[];
  rejected: Post[];
}

interface SettingsData {
  masterProfile: string;
  subreddits: string;
  dmPrompt: string;
  commentPrompt: string;
  geminiKey: string;
  geminiModel: string;
  telegramToken: string;
  telegramChatId: string;
  useTelegram: boolean;
  runStartHour: number;
  runEndHour: number;
}

const formatHour = (hour: number) => {
  if (hour === 0) return '12:00 AM (Midnight)';
  if (hour === 12) return '12:00 PM (Noon)';
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
};

function App() {
  const [data, setData] = useState<PostsData>({ all: [], matched: [], rejected: [] });
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = useState<'matched' | 'rejected' | 'all' | 'settings'>('matched');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api/posts');
      const json = await res.json();
      setData({
        all: json.all || [],
        matched: json.matched || [],
        rejected: json.rejected || []
      });
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api/settings');
      const json = await res.json();
      setSettingsData(json);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSettings();
    const interval = setInterval(fetchPosts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleGeneratePitch = async (postId: string) => {
    setGeneratingFor(postId);
    try {
      const res = await fetch('http://localhost:3001/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const result = await res.json();
      if (result.success) {
        alert('Pitch Generated!\n\nDM Message:\n' + result.pitch.dmMessage + '\n\nReply:\n' + result.pitch.replyMessage);
      } else {
        alert('Failed to generate pitch: ' + result.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsData) return;
    setSavingSettings(true);
    try {
      const res = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      alert('Error saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getActiveData = () => {
    return data[activeTab as keyof PostsData] || [];
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" />
            Lead Assistant
          </h1>
          <p className="text-text-muted mt-2 text-lg">24/7 Reddit Scraping & AI Outreach</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-green-400">{data.matched.length}</span>
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">Matched</span>
          </div>
          <div className="glass-panel px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-red-400">{data.rejected.length}</span>
            <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">Rejected</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex gap-4 border-b border-slate-700/50 pb-px overflow-x-auto">
        <button 
          onClick={() => setActiveTab('matched')}
          className={`px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'matched' ? 'text-blue-400' : 'text-text-muted hover:text-slate-300'}`}
        >
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Matched Leads</span>
          {activeTab === 'matched' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'rejected' ? 'text-red-400' : 'text-text-muted hover:text-slate-300'}`}
        >
          <span className="flex items-center gap-2"><XCircle className="w-4 h-4"/> Rejected</span>
          {activeTab === 'rejected' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'all' ? 'text-slate-200' : 'text-text-muted hover:text-slate-300'}`}
        >
          <span className="flex items-center gap-2"><Search className="w-4 h-4"/> All Posts</span>
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]" />}
        </button>
        <div className="flex-1"></div>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'settings' ? 'text-indigo-400' : 'text-text-muted hover:text-slate-300'}`}
        >
          <span className="flex items-center gap-2"><Settings className="w-4 h-4"/> Settings</span>
          {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col gap-6">
        {activeTab === 'settings' ? (
          <div className="glass-panel p-8 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-400" /> Assistant Settings
            </h2>
            {settingsData ? (
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-8">
                {/* Configuration Section */}
                <div className="flex flex-col gap-6">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">AI Settings</h3>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Gemini API Key</label>
                    <input 
                      type="password"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.geminiKey}
                      onChange={(e) => setSettingsData({...settingsData, geminiKey: e.target.value})}
                      placeholder="AIzaSy..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Gemini Model</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.geminiModel}
                      onChange={(e) => setSettingsData({...settingsData, geminiModel: e.target.value})}
                      placeholder="gemini-3.1-flash-lite"
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mt-4">Telegram Alerts</h3>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="useTelegram"
                      className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500"
                      checked={settingsData.useTelegram}
                      onChange={(e) => setSettingsData({...settingsData, useTelegram: e.target.checked})}
                    />
                    <label htmlFor="useTelegram" className="text-sm font-semibold text-slate-300">Enable Telegram Alerts</label>
                  </div>

                  {settingsData.useTelegram && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Bot Token</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                          value={settingsData.telegramToken}
                          onChange={(e) => setSettingsData({...settingsData, telegramToken: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Chat ID</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                          value={settingsData.telegramChatId}
                          onChange={(e) => setSettingsData({...settingsData, telegramChatId: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2 mt-4">Scraping & Strategy</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Run Start Time</label>
                      <select 
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                        value={settingsData.runStartHour}
                        onChange={(e) => setSettingsData({...settingsData, runStartHour: parseInt(e.target.value) || 0})}
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{formatHour(i)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Run End Time</label>
                      <select 
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                        value={settingsData.runEndHour}
                        onChange={(e) => setSettingsData({...settingsData, runEndHour: parseInt(e.target.value) || 0})}
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{formatHour(i)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Subreddits (Comma separated)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.subreddits}
                      onChange={(e) => setSettingsData({...settingsData, subreddits: e.target.value})}
                      placeholder="RemoteJobs, devjobs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Master Profile</label>
                    <textarea 
                      rows={8}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.masterProfile}
                      onChange={(e) => setSettingsData({...settingsData, masterProfile: e.target.value})}
                      placeholder="Enter your experience, tech stack, and goals..."
                    />
                    <p className="text-xs text-text-muted mt-2">The AI uses this profile to determine if a job post is a match and to personalize the DM.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">DM Prompt Instruction</label>
                    <textarea 
                      rows={2}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.dmPrompt}
                      onChange={(e) => setSettingsData({...settingsData, dmPrompt: e.target.value})}
                      placeholder="Speak engineer-to-engineer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Comment Prompt</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      value={settingsData.commentPrompt}
                      onChange={(e) => setSettingsData({...settingsData, commentPrompt: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button 
                    type="submit" 
                    className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                    disabled={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : getActiveData().length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-4 p-12 glass-panel border-dashed border-slate-600">
            <Search className="w-12 h-12 opacity-50" />
            <p className="text-xl">No posts found in this category.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {getActiveData().map(post => (
              <div key={post.id} className="glass-panel p-6 flex flex-col gap-4 group hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-semibold leading-tight mb-2">
                      <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
                        {post.title}
                      </a>
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                      <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded">r/{post.subreddit}</span>
                      <span>u/{post.author}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(post.created_utc * 1000).toLocaleString()}</span>
                    </div>
                  </div>
                  <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-blue-400 transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {post.selftext}
                </div>

                {activeTab === 'matched' && post.pitch && (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Suggested DM Pitch</h4>
                      <p className="text-sm text-blue-100 whitespace-pre-wrap">{post.pitch.dmMessage}</p>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500 shadow-green-500/20"
                        onClick={() => {
                          window.postMessage({
                            type: 'REDDIT_EXECUTE_AUTOMATION',
                            payload: {
                              postUrl: post.permalink,
                              author: post.author,
                              dmMessage: post.pitch!.dmMessage,
                              replyMessage: post.pitch!.replyMessage
                            }
                          }, '*');
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Auto-Reply & DM (Extension)
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'rejected' && (
                  <div className="mt-2 flex justify-end">
                    <button 
                      className="btn-primary flex items-center gap-2"
                      onClick={() => handleGeneratePitch(post.id)}
                      disabled={generatingFor === post.id}
                    >
                      {generatingFor === post.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {generatingFor === post.id ? 'Generating...' : 'Force Generate Pitch'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
