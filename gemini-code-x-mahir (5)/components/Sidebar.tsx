
import React, { useState } from 'react';
import { ViewType, Theme, UserProfile, StoredChatSession } from '../types';
import { ImageIcon, Code2, Command, Settings, LogOut, User as UserIcon, Plus, MessageSquare, Trash2, Search, Info, HardDrive, CheckCircle } from 'lucide-react';

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
      <aside className="w-[280px] flex flex-col h-full flex-shrink-0 bg-black border-r border-white/10 transition-all z-20">
        <div className="p-4 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
               <Command size={18} className="text-black" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight block leading-none">MAHIR</span>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest">OWNER & ARCHITECT</span>
            </div>
          </div>
          
          <button 
             onClick={onNewChat}
             className="w-full flex items-center gap-2 px-3 py-2.5 bg-white text-black rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm mb-6"
           >
             <Plus size={16} /> New Chat
           </button>

          <nav className="space-y-1 mb-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  currentView === item.id
                    ? 'bg-white/10 text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={`${currentView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-4 pb-2">
          <div className="flex items-center justify-between mb-2 px-2">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent History</span>
             <div className="flex gap-2">
                <button onClick={onBackup} title="Backup History (Zip)" className="text-slate-500 hover:text-blue-400"><HardDrive size={12}/></button>
                <button onClick={() => setShowInfo(true)} title="System Info" className="text-slate-500 hover:text-white"><Info size={12}/></button>
             </div>
          </div>
          
          <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-600" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-[#171717] border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:ring-1 focus:ring-slate-500 placeholder-slate-600 outline-none"
              />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600 italic">No history found</div>
            ) : (
              filteredSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-all ${
                    activeSessionId === session.id ? 'bg-[#171717] text-white border border-white/5' : 'text-slate-400 hover:bg-[#171717] hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <MessageSquare size={14} className={activeSessionId === session.id ? "text-blue-400" : "text-slate-600"} />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} 
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black">
          {user ? (
            <div className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{user.name}</span>
                  <span className="text-[10px] text-slate-500">Synced • Settings</span>
                </div>
              </div>
              <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><LogOut size={16} /></button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all border border-dashed border-white/10 hover:border-white/30"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><UserIcon size={14} /></div>
              <div className="flex flex-col text-left"><span className="text-xs font-bold">Sign In</span><span className="text-[10px] text-slate-500">Enable Cloud Sync</span></div>
            </button>
          )}
        </div>
      </aside>

      {showInfo && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowInfo(false)}>
           <div className="bg-[#1e1e1e] border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                 <div className="p-2 bg-white text-black rounded-lg"><Command size={20} /></div>
                 <div><h3 className="text-xl font-bold text-white">Gemini Code x Mahir</h3><p className="text-xs text-slate-400">System v2.1.0 | Build: Crystal Black</p></div>
              </div>
              <div className="space-y-3 mb-6">
                 {["React Live Preview", "Image Paste (Vision)", "YouTube -> MQL4", "DeepSeek R1 Simulation", "GitHub Analysis", "Auto-fix & Compare"].map((feat, i) => (
                   <div key={i} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle size={14} className="text-green-500" /> {feat}</div>
                 ))}
              </div>
              <button onClick={() => setShowInfo(false)} className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200">Close</button>
           </div>
        </div>
      )}
    </>
  );
};
