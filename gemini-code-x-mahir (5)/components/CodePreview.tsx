
import React, { useEffect, useRef, useState } from 'react';
import { Eye, Code, Copy, Check, Columns } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodePreviewProps {
  code: string;
  theme: 'light' | 'dark';
}

export const CodePreview: React.FC<CodePreviewProps> = ({ code, theme }) => {
  const [mode, setMode] = useState<'preview' | 'code' | 'split'>('preview');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect if code is React/JSX
  const isReact = code.includes('import React') || code.includes('export default function') || code.includes('className=');

  // Construct the full document with React/Babel if needed
  const fullDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        ${isReact ? `
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        ` : ''}
        <style>
          body { font-family: sans-serif; background-color: #000; color: #fff; margin: 0; padding: 0; }
          /* Scrollbar styling to match app */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #000; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          #root { height: 100vh; width: 100vw; overflow: auto; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        ${isReact ? `
        <script type="text/babel">
          const { useState, useEffect, useRef } = React;
          try {
            ${code.replace(/import .*?;/g, '')} 
            // Attempt to mount the default export or a component named App
            const RootComponent = (typeof App !== 'undefined') ? App : (typeof Example !== 'undefined' ? Example : null);
            if (RootComponent) {
               const root = ReactDOM.createRoot(document.getElementById('root'));
               root.render(<RootComponent />);
            } else {
               document.getElementById('root').innerHTML = '<div class="p-4 text-red-400">Could not find "App" component to render. Ensure you export a component named App.</div>';
            }
          } catch (err) {
            document.getElementById('root').innerHTML = '<div class="p-4 text-red-500 font-mono"><h3 class="font-bold">Runtime Error:</h3>' + err.message + '</div>';
          }
        </script>
        ` : `
        <div class="p-4">
           ${code}
        </div>
        `}
      </body>
    </html>
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-white/10">
        <div className="flex bg-white/5 rounded-lg p-1">
          <button onClick={() => setMode('preview')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'preview' ? 'bg-white/10 text-white' : 'text-slate-500'}`}><Eye size={14} /> Preview</button>
          <button onClick={() => setMode('code')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'code' ? 'bg-white/10 text-white' : 'text-slate-500'}`}><Code size={14} /> Code</button>
          <button onClick={() => setMode('split')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'split' ? 'bg-white/10 text-white' : 'text-slate-500'}`}><Columns size={14} /> Split</button>
        </div>
        
        <div className="flex items-center gap-2">
           {isReact && <span className="text-[10px] text-blue-400 font-mono px-2 py-1 bg-blue-500/10 rounded">REACT ENABLED</span>}
           <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors">
             {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden flex">
        {(mode === 'preview' || mode === 'split') && (
          <iframe
            ref={iframeRef}
            title="Live Preview"
            srcDoc={fullDocument}
            className={`${mode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'} h-full bg-black`}
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
          />
        )}
        {(mode === 'code' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-auto custom-scrollbar bg-[#1e1e1e]`}>
             <SyntaxHighlighter
              style={vscDarkPlus}
              language={isReact ? "jsx" : "html"}
              showLineNumbers={true}
              customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '13px', minHeight: '100%' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
};
