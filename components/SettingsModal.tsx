
import React, { useState } from 'react';
import { X, Save, Key, Cpu, Github, Activity, Shield, CheckCircle } from 'lucide-react';
import { AppSettings, AIProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'api' | 'system'>('general');

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-glow">
                            <Cpu size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">System Configuration</h2>
                            <p className="text-xs text-slate-400 font-mono">GEMINI CORE v2.5</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 bg-black/20 border-r border-white/5 p-4 space-y-2">
                        <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                            <Activity size={16} /> General
                        </button>
                        <button onClick={() => setActiveTab('api')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'api' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                            <Key size={16} /> API Keys
                        </button>
                        <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'system' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                            <Shield size={16} /> System
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#050505]">

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider block">AI Provider Engine</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {(['gemini', 'deepseek', 'openai'] as AIProvider[]).map(provider => (
                                            <div
                                                key={provider}
                                                onClick={() => setLocalSettings({ ...localSettings, activeProvider: provider })}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${localSettings.activeProvider === provider ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${localSettings.activeProvider === provider ? 'border-blue-400' : 'border-slate-600'}`}>
                                                        {localSettings.activeProvider === provider && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                                                    </div>
                                                    <span className="capitalize font-bold text-white">{provider}</span>
                                                </div>
                                                {localSettings.activeProvider === provider && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">ACTIVE</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'api' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2"><Github size={14} /> GitHub Personal Access Token</label>
                                    <input
                                        type="password"
                                        value={localSettings.githubToken || ''}
                                        onChange={(e) => setLocalSettings({ ...localSettings, githubToken: e.target.value })}
                                        placeholder="ghp_xxxxxxxxxxxx"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors font-mono"
                                    />
                                    <p className="text-[10px] text-slate-500">Required for pushing code to repositories. Token is stored locally.</p>
                                </div>

                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1"><Shield size={14} /> SECURITY NOTICE</div>
                                    <p className="text-[10px] text-yellow-500/80">API Keys are encrypted and stored in your browser's local storage. They are never sent to our servers.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Haptic Feedback</h3>
                                        <p className="text-xs text-slate-500">Vibrate on success/error</p>
                                    </div>
                                    <button
                                        onClick={() => setLocalSettings({ ...localSettings, enableVibration: !localSettings.enableVibration })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enableVibration ? 'bg-green-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.enableVibration ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Auto-Save Interval</h3>
                                        <p className="text-xs text-slate-500">Sync frequency in seconds</p>
                                    </div>
                                    <select
                                        value={localSettings.autoSaveInterval}
                                        onChange={(e) => setLocalSettings({ ...localSettings, autoSaveInterval: Number(e.target.value) })}
                                        className="bg-black border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none"
                                    >
                                        <option value={10}>10s (High)</option>
                                        <option value={30}>30s (Normal)</option>
                                        <option value={60}>60s (Low)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg">
                        <Save size={16} /> Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
};
