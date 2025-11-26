
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Loader2, Play, X, Settings, Plus, Github, Pin, PinOff, UploadCloud, FileCode, Archive, Folder, Youtube, Image as ImageIcon, Zap, AlertTriangle, MonitorPlay, Save } from 'lucide-react';
import { ChatMessage, Sender, Theme, StoredChatSession, ModelConfig, Attachment, UserProfile, UploadStatus, AppSettings } from '../types';
import { createChatSession, sendMessageStream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Chat } from '@google/genai';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip';
import { CodePreview } from './CodePreview';
import { GithubService } from '../services/githubService';
import { SettingsModal } from './SettingsModal';

interface ChatViewProps {
  theme: Theme;
  user: UserProfile | null;
  session: StoredChatSession | null;
  onUpdateSession: (id: string, messages: ChatMessage[], config: ModelConfig) => void;
  onNewChat: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

const DEFAULT_CONFIG: ModelConfig = {
  temperature: 1.0,
  topK: 64,
  topP: 0.95,
  deepThinking: false,
};

export const ChatView: React.FC<ChatViewProps> = ({ theme, user, session, onUpdateSession, onNewChat, settings, onUpdateSettings }) => {
  // State from Session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  
  // Local State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  
  // UI State
  const [showConfig, setShowConfig] = useState(false);
  const [isConfigPinned, setIsConfigPinned] = useState(false);
  const [showGithubInput, setShowGithubInput] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
    if (session) {
      setMessages(session.messages);
      setConfig(session.config || DEFAULT_CONFIG);
      try {
        const newChat = createChatSession(session.messages, session.config, settings.activeProvider);
        setChatSession(newChat);
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    } else {
      onNewChat();
    }
    setAttachments([]);
  }, [session?.id, settings.activeProvider]); 

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === Sender.MODEL && !isLoading) {
        const extracted = extractCode(lastMsg.text);
        if (extracted) {
           setPreviewContent(extracted);
        }
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-save Interval (30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (session && messages.length > 0) {
        setSaveStatus('saving');
        onUpdateSession(session.id, messages, config);
        setTimeout(() => setSaveStatus('saved'), 800);
      }
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [messages, config, session, onUpdateSession]);

  const updateSession = (newMessages: ChatMessage[], newConfig: ModelConfig) => {
    setSaveStatus('saving');
    if (session) {
      onUpdateSession(session.id, newMessages, newConfig);
    }
    setTimeout(() => setSaveStatus('saved'), 500);
  };

  // --- ACTIONS ---

  const extractCode = (markdown: string): string | null => {
    // Priority: React/JSX, then HTML
    const jsxMatch = markdown.match(/```(?:jsx|tsx|javascript|react)([\s\S]*?)```/);
    if (jsxMatch && (jsxMatch[1].includes('export default') || jsxMatch[1].includes('return ('))) return jsxMatch[1];

    const htmlMatch = markdown.match(/```html([\s\S]*?)```/);
    if (htmlMatch) return htmlMatch[1];
    return null;
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && attachments.length === 0) || !chatSession || isLoading) return;
    
    let promptText = textToSend.trim();
    
    // YouTube / MQL4 Logic
    if (youtubeUrl) {
       promptText = `[SYSTEM: USER PROVIDED YOUTUBE URL: ${youtubeUrl}]\nACT AS A LEAD QUANT DEVELOPER. ANALYZE THE STRATEGY FROM THIS VIDEO CONTEXT AND GENERATE MQL4 INDICATOR CODE.\n${promptText}`;
       setYoutubeUrl('');
       setShowYoutubeInput(false);
    }
    else if (promptText.includes('youtube.com/') || promptText.includes('youtu.be/')) {
        promptText = `[SYSTEM: USER HAS PROVIDED A YOUTUBE LINK. EXTRACT TRADING STRATEGY AND GENERATE MQL4 CODE]\n${promptText}`;
    }

    if (isDeepResearch) {
      promptText = `[DEEP RESEARCH MODE ACTIVE]\n- SEARCH OPEN SOURCE PATTERNS.\n- ANALYZE GITHUB REPOSITORIES FOR SIMILAR SOLUTIONS.\n- PROVIDE COMPREHENSIVE ARCHITECTURAL BREAKDOWN.\n\n${promptText}`;
    }

    if (attachments.length > 0) {
      const textFiles = attachments.filter(a => a.type !== 'image');
      if (textFiles.length > 0) {
          promptText = `${promptText}\n\n=== ATTACHED FILES ===\n${textFiles.map(att => `[FILE] ${att.path || att.name}:\n\`\`\`\n${att.content}\n\`\`\``).join('\n\n')}`;
      }
    }
    
    const displayInput = textToSend.trim();
    const displayAttachments = [...attachments]; 
    setInput(''); 
    setAttachments([]); 
    setIsLoading(true);

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      sender: Sender.USER, 
      text: displayAttachments.length > 0 ? `${displayInput}\n\n*Uploaded ${displayAttachments.length} file(s)*` : displayInput, 
      timestamp: Date.now(),
      attachments: displayAttachments
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    updateSession(updatedMessages, config); 

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: ChatMessage = { id: modelMsgId, sender: Sender.MODEL, text: '', timestamp: Date.now() };
    const messagesWithPlaceholder = [...updatedMessages, modelMsg];
    setMessages(messagesWithPlaceholder);

    try {
      let fullText = '';
      const stream = sendMessageStream(chatSession, promptText, displayAttachments);
      for await (const chunk of stream) { 
        fullText += chunk; 
        const streamingMessages = messagesWithPlaceholder.map(msg => msg.id === modelMsgId ? { ...msg, text: fullText } : msg);
        setMessages(streamingMessages);
      }
      updateSession(messagesWithPlaceholder.map(msg => msg.id === modelMsgId ? { ...msg, text: fullText } : msg), config);
    } catch (error) { 
       const errorMessages = messagesWithPlaceholder.map(msg => msg.id === modelMsgId ? { ...msg, text: "Error: Connection interrupted.", isError: true } : msg);
       setMessages(errorMessages);
       updateSession(errorMessages, config);
    } finally { 
       setIsLoading(false); 
    }
  };

  const handleAnalyzeError = (errorMsg: string) => {
      const prompt = `I am encountering this error in my code. Please analyze it and provide a fix:\n\n${errorMsg}`;
      setInput(prompt);
      handleSend(prompt);
  };

  const handlePushToGithub = async () => {
    if (!settings.githubToken) {
      alert("Please configure your GitHub Token in Settings first.");
      setShowSettingsModal(true);
      return;
    }
    // Logic to push would go here
    alert("GitHub Integration: Feature simulation. In production, this pushes the preview code to a new repo.");
  };

  // --- PASTE & FILE HANDLING ---
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
             const base64 = event.target?.result as string;
             const newAtt: Attachment = {
               name: `pasted_image_${Date.now()}.png`,
               content: base64,
               type: 'image',
               mimeType: blob.type
             };
             setAttachments(prev => [...prev, newAtt]);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const processFile = async (file: File, path: string = ''): Promise<Attachment> => {
     return new Promise((resolve) => {
         const reader = new FileReader();
         reader.onload = (e) => {
             const isImage = file.type.startsWith('image/');
             resolve({
                 name: file.name,
                 content: e.target?.result as string,
                 path: path ? `${path}/${file.name}` : file.name,
                 type: isImage ? 'image' : 'text',
                 mimeType: file.type
             });
         };
         if (file.type.startsWith('image/')) reader.readAsDataURL(file);
         else reader.readAsText(file);
     });
  };

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      let language = match ? match[1] : 'text';
      const codeString = String(children).replace(/\n$/, '');

      // Specific handling for MQL4
      const isMQL4 = language === 'mql4' || language === 'mq4';
      if (isMQL4) language = 'cpp'; // Map to C++ for styling

      return !inline ? (
        <div className={`my-4 rounded-lg overflow-hidden border ${isMQL4 ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/10'} bg-[#09090b]`}>
          <div className={`px-3 py-1.5 flex items-center justify-between border-b ${isMQL4 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/5'}`}>
            <span className={`text-[10px] font-bold uppercase flex items-center gap-2 ${isMQL4 ? 'text-yellow-400' : 'text-slate-400'}`}>
               {isMQL4 && <Zap size={12} />}
               {isMQL4 ? 'MQL4 TRADING LOGIC' : language}
            </span>
            <div className="flex items-center gap-2">
               {(language === 'html' || language === 'jsx' || language === 'tsx') && (
                  <button onClick={() => { setPreviewContent(codeString); setShowPreview(true); }} className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300"><Play size={10} /> PREVIEW</button>
               )}
            </div>
          </div>
          <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" showLineNumbers={true} wrapLines={true} customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '13px' }} {...props}>{codeString}</SyntaxHighlighter>
        </div>
      ) : (
        <code className="px-1 py-0.5 rounded text-sm bg-white/10 text-slate-200" {...props}>{children}</code>
      );
    }
  };

  return (
    <div 
      className="flex h-full relative bg-[#171717] text-slate-200 overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDrop={async (e) => { e.preventDefault(); setIsDragging(false); }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

      <div className="flex-1 flex flex-col h-full relative bg-[#171717]">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#171717] z-10">
           <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-[#212121] rounded-full hover:bg-[#333] cursor-pointer transition-colors" onClick={() => setShowSettingsModal(true)}>
               <span className="text-sm font-semibold text-white capitalize">{settings.activeProvider} Mode</span>
               {config.deepThinking && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded uppercase">R1 Logic</span>}
             </div>
             
             {/* Toolbar Buttons */}
             <div className="h-6 w-px bg-white/10 mx-1"></div>
             
             <button onClick={() => setShowYoutubeInput(!showYoutubeInput)} className={`p-1.5 rounded-lg ${showYoutubeInput ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="YouTube Analysis">
                <Youtube size={16} />
             </button>
             <button onClick={() => setIsDeepResearch(!isDeepResearch)} className={`p-1.5 rounded-lg ${isDeepResearch ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Deep Research">
                <Zap size={16} />
             </button>
             <button onClick={handlePushToGithub} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5" title="Push to GitHub">
                <Github size={16} />
             </button>
           </div>
           
           <div className="flex items-center gap-2">
             {/* Auto Save Indicator */}
             <div className="flex items-center gap-1.5 px-2">
                {saveStatus === 'saving' ? (
                   <Loader2 size={12} className="text-slate-500 animate-spin" />
                ) : (
                   <Save size={12} className="text-slate-600" />
                )}
                <span className="text-[10px] font-mono text-slate-600 uppercase">{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
             </div>

             {previewContent && (
               <button onClick={() => setShowPreview(!showPreview)} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg" title="Toggle Preview">
                 <MonitorPlay size={18} />
               </button>
             )}
             <button onClick={() => { setShowConfig(!showConfig); setIsConfigPinned(false); }} className={`p-2 rounded-lg ${showConfig ? 'text-white bg-white/10' : 'text-slate-400'}`}><Settings size={18} /></button>
           </div>
        </div>

        {/* INPUT EXTENSION: YOUTUBE */}
        {showYoutubeInput && (
           <div className="px-4 py-2 bg-black border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2">
              <Youtube size={16} className="text-red-500" />
              <input 
                 type="text" 
                 value={youtubeUrl}
                 onChange={(e) => setYoutubeUrl(e.target.value)}
                 placeholder="Paste YouTube Video URL for Strategy Analysis..."
                 className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-600"
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={() => setShowYoutubeInput(false)}><X size={14} className="text-slate-500 hover:text-white" /></button>
           </div>
        )}

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
           {messages.map((msg, idx) => (
             <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto animate-message ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === Sender.MODEL && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-glow">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] ${msg.sender === Sender.USER ? 'bg-[#2f2f2f] rounded-2xl px-5 py-3 text-white' : 'text-slate-200'}`}>
                   {/* Attachments Display in Message */}
                   {msg.attachments && msg.attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((att, i) => (
                          att.type === 'image' ? (
                            <img key={i} src={att.content} className="w-20 h-20 object-cover rounded-lg border border-white/10" alt="attachment" />
                          ) : (
                            <div key={i} className="flex items-center gap-1 text-xs bg-black/20 px-2 py-1 rounded"><FileCode size={12}/> {att.name}</div>
                          )
                        ))}
                     </div>
                   )}

                   {msg.sender === Sender.USER ? (
                     <div className="whitespace-pre-wrap">{msg.text}</div>
                   ) : (
                     <div className="prose prose-invert prose-sm max-w-none">
                       <ReactMarkdown components={markdownComponents as any}>{msg.text}</ReactMarkdown>
                       {msg.isError && (
                         <div className="mt-2">
                           <button onClick={() => handleAnalyzeError(msg.text)} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs transition-colors">
                             <AlertTriangle size={12} /> Analyze Error
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                   {msg.sender === Sender.MODEL && isLoading && idx === messages.length - 1 && (
                     <div className="flex items-center gap-2 mt-2 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" /> Generating...</div>
                   )}
                </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 md:p-6 bg-[#171717]">
          <div className="max-w-3xl mx-auto">
             {attachments.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group">
                      {att.type === 'image' ? (
                        <div className="relative">
                           <img src={att.content} className="w-16 h-16 object-cover rounded-lg border border-white/20" alt="preview" />
                           <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-[#212121] px-3 py-2 rounded-lg text-xs border border-white/5">
                           <FileCode size={14} className="text-blue-400" />
                           <span className="truncate max-w-[100px]">{att.name}</span>
                           <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X size={12} /></button>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
             )}

             <div className="relative bg-[#212121] rounded-2xl border border-white/5 focus-within:border-white/20 transition-colors shadow-lg">
                <textarea
                  ref={textAreaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  onPaste={handlePaste}
                  placeholder="Ask Gemini Code... (Paste images, drag folders)"
                  className="w-full bg-transparent text-white p-4 max-h-[200px] resize-none focus:outline-none text-sm"
                  rows={1}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                   <div className="flex items-center gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg" title="Upload Files">
                        <Plus size={18} />
                      </button>
                      <button onClick={() => setShowYoutubeInput(true)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg" title="Analyze YouTube">
                        <Youtube size={18} />
                      </button>
                      {/* Hidden inputs */}
                      <input type="file" multiple ref={fileInputRef} onChange={(e) => { if(e.target.files) Array.from(e.target.files).forEach(f => processFile(f).then(att => setAttachments(p => [...p, att]))); }} className="hidden" />
                   </div>
                   <button onClick={() => handleSend()} disabled={!input.trim() && attachments.length === 0} className="p-2 bg-white text-black rounded-lg">
                     {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                   </button>
                </div>
             </div>
             <p className="text-center text-[10px] text-slate-600 mt-2">Ctrl+V to paste images. Drag & Drop folders supported.</p>
          </div>
        </div>

        {/* SETTINGS MODAL */}
        {showSettingsModal && (
          <SettingsModal 
             isOpen={showSettingsModal} 
             onClose={() => setShowSettingsModal(false)}
             settings={settings}
             onUpdateSettings={onUpdateSettings}
          />
        )}
      </div>

      {/* PREVIEW PANEL */}
      {showPreview && (
        <div className="w-1/2 h-full border-l border-white/10 bg-[#09090b] flex flex-col transition-all duration-300">
           <div className="p-2 border-b border-white/10 flex justify-between items-center bg-[#09090b]">
              <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-2"><Zap size={12} className="text-yellow-400"/> REACT LIVE PREVIEW</span>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-white/10 rounded"><X size={16} /></button>
           </div>
           <div className="flex-1 relative">
             <CodePreview code={previewContent} theme={theme} />
           </div>
        </div>
      )}
    </div>
  );
};
