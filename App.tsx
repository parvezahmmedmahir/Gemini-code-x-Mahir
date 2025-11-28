
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ImageView } from './components/ImageView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ViewType, Theme, UserProfile, StoredChatSession, ModelConfig, ChatMessage, Sender, AppSettings } from './types';
import { Loader2, Command } from 'lucide-react';
import JSZip from 'jszip';
import './index.css';

const DEFAULT_CONFIG: ModelConfig = {
  temperature: 1.0,
  topK: 64,
  topP: 0.95,
  deepThinking: false,
};

const SYSTEM_INIT_MSG: ChatMessage = {
  id: 'init',
  sender: Sender.MODEL,
  text: "# SYSTEM ONLINE: Gemini Code x Mahir\n\n**Architecture:** Crystal Black v2.0\n**Engine:** DeepSeek R1 Logic Simulation + Gemini 2.5\n\nI am ready. Paste images (Ctrl+V), drag folders, or drop YouTube links for MQL4 analysis.",
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.CHAT);
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    activeProvider: 'gemini',
    enableVibration: true,
    autoSaveInterval: 30
  });

  // History State
  const [savedSessions, setSavedSessions] = useState<StoredChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load User & History from Storage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');

    const savedUser = localStorage.getItem('gemini_user_profile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Load History when user changes
  useEffect(() => {
    const key = user ? `gemini_chat_history_${user.id}` : 'gemini_chat_history_guest';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSessions(parsed);
      } catch (e) {
        console.error("Failed to parse history", e);
        setSavedSessions([]);
      }
    } else {
      setSavedSessions([]);
    }
  }, [user]);

  const saveToStorage = useCallback((sessions: StoredChatSession[]) => {
    const key = user ? `gemini_chat_history_${user.id}` : 'gemini_chat_history_guest';
    localStorage.setItem(key, JSON.stringify(sessions));
  }, [user]);

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: StoredChatSession = {
      id: newId,
      userId: user?.id || 'guest',
      title: 'New Chat',
      messages: [SYSTEM_INIT_MSG],
      config: DEFAULT_CONFIG,
      lastModified: Date.now()
    };

    const updatedSessions = [newSession, ...savedSessions];
    setSavedSessions(updatedSessions);
    setCurrentSessionId(newId);
    setCurrentView(ViewType.CHAT);
    saveToStorage(updatedSessions);
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    saveToStorage(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleUpdateSession = (id: string, messages: ChatMessage[], config: ModelConfig) => {
    setSavedSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          let title = s.title;
          if (title === 'New Chat' && messages.length > 1) {
            const userMsg = messages.find(m => m.sender === Sender.USER);
            if (userMsg) {
              title = userMsg.text.split('\n')[0].slice(0, 30) + '...';
            }
          }
          return { ...s, messages, config, title, lastModified: Date.now() };
        }
        return s;
      });
      const sorted = [...updated].sort((a, b) => b.lastModified - a.lastModified);
      saveToStorage(sorted);
      return sorted;
    });
  };

  const handleBackup = async () => {
    try {
      const zip = new JSZip();
      const data = JSON.stringify(savedSessions, null, 2);
      zip.file(`gemini_backup_${new Date().toISOString().split('T')[0]}.json`, data);
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gemini_Mahir_Backup.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Backup failed");
    }
  };

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      const mockUser: UserProfile = {
        id: 'user_12345',
        name: 'Mahir Dev',
        email: 'mahir@example.com',
        avatar: 'https://ui-avatars.com/api/?name=Mahir+Dev&background=random'
      };
      setUser(mockUser);
      localStorage.setItem('gemini_user_profile', JSON.stringify(mockUser));
      setIsLoggingIn(false);
      setShowLogin(false);
    }, 1500);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gemini_user_profile');
    setCurrentSessionId(null);
    setSavedSessions([]);
  };

  const activeSession = savedSessions.find(s => s.id === currentSessionId) || null;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-[#050505] text-white selection:bg-blue-500/30">
      {showLogin && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

            <div className="w-14 h-14 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-glow">
              <Command size={24} className="text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm mb-8">Sign in to sync your neural history.</p>

            <button onClick={handleLogin} disabled={isLoggingIn} className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 shadow-lg">
              {isLoggingIn ? <Loader2 className="animate-spin" /> : <>Continue with Google</>}
            </button>
            <button onClick={() => setShowLogin(false)} className="mt-6 text-xs text-slate-500 hover:text-white transition-colors">Cancel Operation</button>
          </div>
        </div>
      )}

      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        theme={theme}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        sessions={savedSessions}
        activeSessionId={currentSessionId}
        onSelectSession={(id) => { setCurrentSessionId(id); setCurrentView(ViewType.CHAT); }}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        onBackup={handleBackup}
      />

      <main className="flex-1 h-full relative flex flex-col bg-[#050505]">
        <ErrorBoundary theme={theme}>
          {currentView === ViewType.CHAT && (
            <ChatView
              theme={theme}
              user={user}
              session={activeSession}
              onUpdateSession={handleUpdateSession}
              onNewChat={handleNewChat}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}
          {currentView === ViewType.IMAGE && <ImageView theme={theme} />}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
