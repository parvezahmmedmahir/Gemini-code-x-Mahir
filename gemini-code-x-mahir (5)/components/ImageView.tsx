import React, { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCw, Wand2, AlertTriangle, Maximize2, Aperture } from 'lucide-react';
import { GeneratedImage, Theme } from '../types';
import { generateImage } from '../services/geminiService';

interface ImageViewProps {
  theme: Theme;
}

const STYLE_PRESETS = [
  { value: 'none', label: 'Raw / No Style' },
  { value: 'Photorealistic, 8k, highly detailed, dramatic lighting', label: 'Hyper-Realism' },
  { value: 'Cyberpunk, neon lights, dark sci-fi, glitch art', label: 'Cyberpunk' },
  { value: 'Studio Ghibli style, vibrant, cel shaded', label: 'Anime / Ghibli' },
  { value: 'Unreal Engine 5 render, ray tracing, octane render', label: '3D Render' },
  { value: 'Oil painting, texture, classical', label: 'Classic Oil' },
  { value: 'Minimalist vector, flat design, clean lines', label: 'Vector Icon' },
];

export const ImageView: React.FC<ImageViewProps> = ({ theme }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "3:4">("1:1");
  const [stylePreset, setStylePreset] = useState('none');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const dataUrl = await generateImage(prompt, aspectRatio, stylePreset, negativePrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: prompt,
        dataUrl: dataUrl,
        timestamp: Date.now()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (dataUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `gemini-mahir-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-black text-white">
      <div className="max-w-7xl mx-auto w-full p-8 space-y-10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
           <div>
              <h2 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-3">
                <Aperture className="text-white" /> Asset Studio
              </h2>
              <p className="text-slate-500 mt-1 font-mono text-xs">GEMINI 2.5 FLASH IMAGE PIPELINE</p>
           </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vision in detail..."
                  className="w-full h-40 p-6 rounded-2xl bg-[#09090b] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black transition-all resize-none relative z-10 text-lg font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input 
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Negative prompt (what to exclude)"
                    className="w-full px-4 py-3 rounded-xl bg-[#09090b] border border-white/10 text-sm focus:outline-none focus:border-white/30 transition-colors"
                 />
                 
                 <div className="flex gap-2">
                    <select 
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="w-1/3 px-3 py-3 rounded-xl bg-[#09090b] border border-white/10 text-xs font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="1:1">1:1 SQ</option>
                      <option value="16:9">16:9 WD</option>
                      <option value="3:4">3:4 PT</option>
                    </select>

                    <select 
                        value={stylePreset}
                        onChange={(e) => setStylePreset(e.target.value)}
                        className="flex-1 px-3 py-3 rounded-xl bg-[#09090b] border border-white/10 text-xs font-mono focus:outline-none cursor-pointer"
                    >
                      {STYLE_PRESETS.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-1 flex flex-col justify-end">
              <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={`w-full h-full min-h-[160px] rounded-2xl flex flex-col items-center justify-center gap-4 border transition-all duration-300 group ${
                    !prompt.trim() || isGenerating
                      ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                      : 'bg-white text-black border-white hover:bg-slate-200 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={32} className="animate-spin" />
                      <span className="text-xs font-bold tracking-widest">RENDERING...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={32} className="group-hover:rotate-12 transition-transform" />
                      <span className="text-xs font-bold tracking-widest">GENERATE ASSET</span>
                    </>
                  )}
                </button>
                {error && <div className="mt-4 text-red-400 text-xs text-center">{error}</div>}
           </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {generatedImages.map((img) => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden bg-[#09090b] border border-white/10">
              <div className={`aspect-[${img.prompt.includes("16:9") ? '16/9' : img.prompt.includes("3:4") ? '3/4' : '1/1'}] relative`}>
                <img 
                  src={img.dataUrl} 
                  alt={img.prompt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                   <div className="flex gap-2 justify-end">
                       <button onClick={() => handleDownload(img.dataUrl, img.id)} className="p-2 bg-white text-black rounded-lg hover:bg-slate-200"><Download size={16} /></button>
                       <button onClick={() => window.open(img.dataUrl, '_blank')} className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 backdrop-blur"><Maximize2 size={16} /></button>
                   </div>
                </div>
              </div>
              <div className="p-3 border-t border-white/5">
                <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">{img.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};