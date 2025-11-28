
import React, { useState } from 'react';
import { ViewType, Theme, UserProfile, StoredChatSession } from '../types';
import { ImageIcon, Code2, Command, Settings, LogOut, User as UserIcon, Plus, MessageSquare, Trash2, Search, Info, HardDrive, CheckCircle, Activity, Cpu, Shield } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  theme: Theme;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  sessions: StoredChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onBackup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, onViewChange, theme, user, onLogin, onLogout,
  sessions, activeSessionId, onSelectSession, onDeleteSession, onNewChat, onBackup
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const navItems = [
    {
      id: ViewType.CHAT,
      label: 'Gemini Code',
      icon: <Code2 size={18} />,
    },
    {
      id: ViewType.IMAGE,
      label: 'Asset Studio',
      icon: <ImageIcon size={18} />,
    }
  ];

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <>
      <aside className="w-[280px] flex flex-col h-full flex-shrink-0 bg-black/80 backdrop-blur-xl border-r border-white/5 transition-all z-20 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-600/10 blur-[80px] pointer-events-none" />

        <div className="p-4 pt-6 relative z-10">
          <div className="flex items-center gap-3 mb-8 px-2 group cursor-pointer" onClick={() => setShowInfo(true)}>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-300 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all duration-300">
                <Command size={20} className="text-black" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight block leading-none font-sans">MAHIR</span>
              <span className="text-[9px] text-blue-400 font-mono tracking-widest uppercase">System Online</span>
            </div>
          </div>

          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 font-semibold text-sm mb-8 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus size={18} /> <span className="relative z-10">New Operation</span>
          </button>

          <nav className="space-y-1 mb-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${currentView === item.id
                    ? 'bg-white/10 text-white shadow-lg border border-white/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
              >
                <span className={`${currentView === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {currentView === item.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l-full shadow-[0_0_10px_#3b82f6]" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-4 pb-2 relative z-10">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={10} /> Operations Log
            </span>
            <div className="flex gap-2">
              <button onClick={onBackup} title="Backup History (Zip)" className="text-slate-600 hover:text-blue-400 transition-colors"><HardDrive size={12} /></button>
            </div>
          </div>

          <div className="relative mb-4 group">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search logs..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:border-blue-500/50 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] placeholder-slate-600 outline-none transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-700 font-mono">NO DATA FOUND</div>
            ) : (
              filteredSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-all border ${activeSessionId === session.id
                      ? 'bg-white/5 text-white border-white/10 shadow-lg backdrop-blur-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent hover:border-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <MessageSquare size={14} className={activeSessionId === session.id ? "text-blue-400" : "text-slate-600"} />
                    <span className="truncate font-medium">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10">
          {user ? (
            <div className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full border border-white/10" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">LVL 99 • ADMIN</span>
                </div>
              </div>
              <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><LogOut size={16} /></button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all border border-dashed border-white/10 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><UserIcon size={14} /></div>
              <div className="flex flex-col text-left"><span className="text-xs font-bold">Authenticate</span><span className="text-[10px] text-slate-500">Access Cloud Sync</span></div>
            </button>
          )}
        </div>
      </aside>

      {showInfo && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInfo(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6 relative z-10">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-glow"><Command size={24} /></div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Gemini Code</h3>
                <p className="text-xs text-blue-400 font-mono uppercase tracking-wider">System v2.5.0 | Crystal Black</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 relative z-10">
              <div className="grid grid-cols-2 gap-3">
                {["React Live Preview", "Vision Analysis", "MQL4 Strategy", "DeepSeek R1 Logic", "GitHub Sync", "Auto-Debug"].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 p-2 rounded-lg border border-white/5">
                    <CheckCircle size={12} className="text-green-400" /> {feat}
                  </div>
                ))}
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-white/5 mt-4">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
                  <span>CPU USAGE</span>
                  <span className="text-green-400">12%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[12%] bg-green-500 rounded-full" />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-3 mb-2">
                  <span>MEMORY</span>
                  <span className="text-blue-400">4.2GB / 16GB</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[26%] bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>

            <button onClick={() => setShowInfo(false)} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg relative z-10">Close System Info</button>
          </div>
        </div>
      )}
    </>
  );
};
