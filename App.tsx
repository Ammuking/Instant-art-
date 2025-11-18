import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  History, 
  Settings2, 
  Loader2, 
  Trash2, 
  Sparkles, 
  Upload,
  X,
  Share2
} from 'lucide-react';

import { GeneratedImage, GenerationConfig, AppMode } from './types';
import { STYLE_PRESETS, ASPECT_RATIOS, DEFAULT_CONFIG, constructPrompt } from './constants';
import { generateImage, editImage } from './services/geminiService';

const App: React.FC = () => {
  // -- State --
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<AppMode>('generate');
  const [config, setConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode specific state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Effects --
  useEffect(() => {
    // Load history from local storage on mount
    const saved = localStorage.getItem('instantArt_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGeneratedImages(parsed);
        if (parsed.length > 0) setCurrentImage(parsed[0]);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save history
    localStorage.setItem('instantArt_history', JSON.stringify(generatedImages));
  }, [generatedImages]);

  // -- Handlers --

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !uploadedImage) {
        setError("Please upload an image to edit.");
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let imageUrl = '';
      let finalPrompt = '';

      if (mode === 'generate') {
        finalPrompt = constructPrompt(prompt, config);
        console.log("Sending Prompt:", finalPrompt);
        imageUrl = await generateImage(finalPrompt);
      } else {
        // Edit Mode
        // For editing, we keep the prompt simpler as it is an instruction
        finalPrompt = prompt; 
        if (uploadedImage) {
            imageUrl = await editImage(uploadedImage, finalPrompt);
        }
      }
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: finalPrompt,
        timestamp: Date.now(),
        style: config.styleId,
        aspectRatio: config.aspectRatio,
        isEdited: mode === 'edit'
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setCurrentImage(newImage);
      
      // Clear inputs slightly for UX
      // setPrompt(''); 
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setMode('edit'); // Auto switch to edit mode
      };
      reader.readAsDataURL(file);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
        setGeneratedImages([]);
        setCurrentImage(null);
        localStorage.removeItem('instantArt_history');
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `instantArt-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -- Render Helpers --

  const renderSidebar = () => (
    <div className="w-full md:w-80 bg-gray-950 border-r border-gray-800 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <Sparkles size={20} />
          <h1 className="font-bold text-xl tracking-tight text-white">InstantArt</h1>
        </div>
        <p className="text-xs text-gray-500 font-medium">Powered by Gemini 2.5</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <History size={14} /> Gallery
            </h2>
            {generatedImages.length > 0 && (
                <button onClick={clearHistory} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                </button>
            )}
        </div>
        
        <div className="space-y-3">
          {generatedImages.length === 0 && (
            <div className="text-center py-10 px-4 border border-dashed border-gray-800 rounded-lg animate-fade-in">
                <p className="text-gray-600 text-sm">No images yet.</p>
                <p className="text-gray-700 text-xs mt-1">Create something amazing!</p>
            </div>
          )}
          
          {generatedImages.map((img, index) => (
            <div 
              key={img.id}
              onClick={() => setCurrentImage(img)}
              className={`group relative cursor-pointer rounded-lg overflow-hidden border border-gray-800 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-900/20 transition-all animate-slide-in-right ${currentImage?.id === img.id ? 'ring-2 ring-emerald-500/50 border-emerald-500' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img src={img.url} alt="Thumbnail" className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
              {img.isEdited && (
                  <div className="absolute top-2 right-2 bg-blue-600/90 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shadow-lg">Edit</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
            <Settings2 size={16} /> Settings
        </button>
      </div>
    </div>
  );

  const renderMainArea = () => (
    <div className="flex-1 flex flex-col h-screen bg-gray-900 relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 z-10">
        <div className="flex gap-4">
            <button 
                onClick={() => setMode('generate')}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-300 ${mode === 'generate' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
                <Wand2 size={16} className={mode === 'generate' ? 'animate-pulse-subtle' : ''} /> Generate
            </button>
            <button 
                onClick={() => setMode('edit')}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-300 ${mode === 'edit' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
                <ImageIcon size={16} className={mode === 'edit' ? 'animate-pulse-subtle' : ''} /> Edit Image
            </button>
        </div>
        
        {currentImage && (
            <div className="flex gap-2 animate-fade-in">
                <button 
                    onClick={() => downloadImage(currentImage)}
                    className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 p-2 rounded-full transition-all hover:scale-110" 
                    title="Download">
                    <Download size={18} />
                </button>
                <button 
                     className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 p-2 rounded-full transition-all hover:scale-110" 
                     title="Share (Mock)">
                    <Share2 size={18} />
                </button>
            </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        {currentImage ? (
          <div key={currentImage.id} className="relative max-w-4xl w-full flex flex-col items-center animate-slide-up">
             <div className="relative group rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black transition-transform duration-500">
                <img 
                    src={currentImage.url} 
                    alt="Generated Result" 
                    className="max-h-[70vh] w-auto object-contain"
                />
             </div>
             <div className="mt-6 bg-gray-800/50 backdrop-blur-md p-4 rounded-lg border border-gray-700 max-w-2xl w-full animate-fade-in" style={{animationDelay: '0.2s'}}>
                <p className="text-gray-300 text-sm italic leading-relaxed font-light">
                    "{currentImage.prompt}"
                </p>
                <div className="flex gap-4 mt-3 text-xs text-gray-500 font-mono uppercase tracking-wide">
                    <span>{new Date(currentImage.timestamp).toLocaleTimeString()}</span>
                    <span>{currentImage.aspectRatio}</span>
                    <span>{STYLE_PRESETS.find(s => s.id === currentImage.style)?.label}</span>
                </div>
             </div>
          </div>
        ) : (
            <div className="text-center opacity-40 animate-fade-in">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={40} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300">Ready to Create</h3>
                <p className="text-gray-500 mt-2">Enter a prompt or upload an image to get started</p>
            </div>
        )}
      </div>

      {/* Controls / Input Area */}
      <div className="bg-gray-950 border-t border-gray-800 p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         
         {/* Mode: Edit - Upload Preview */}
         {mode === 'edit' && (
             <div className="mb-4 flex items-center gap-4 animate-fade-in">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative hover:scale-105 ${uploadedImage ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800'}`}
                 >
                    {uploadedImage ? (
                        <img src={uploadedImage} alt="Source" className="w-full h-full object-cover animate-scale-in" />
                    ) : (
                        <Upload size={20} className="text-gray-500" />
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-300">Source Image</h4>
                    <p className="text-xs text-gray-500 mt-1">Upload an image to modify. The AI will use this as a reference.</p>
                 </div>
                 {uploadedImage && (
                     <button onClick={() => { setUploadedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-full transition-all hover:rotate-90">
                         <X size={16} />
                     </button>
                 )}
             </div>
         )}

         {/* Mode: Generate - Style & Config Selectors */}
         {mode === 'generate' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 bg-gray-900/50 p-3 rounded-xl border border-gray-800/50 animate-fade-in">
                <div className="flex flex-col gap-1 group">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider group-hover:text-gray-400 transition-colors">Ratio</label>
                    <select 
                        value={config.aspectRatio}
                        onChange={(e) => setConfig({...config, aspectRatio: e.target.value})}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-2 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all"
                    >
                        {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1 group">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider group-hover:text-gray-400 transition-colors">Style</label>
                    <select 
                        value={config.styleId}
                        onChange={(e) => setConfig({...config, styleId: e.target.value})}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-2 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all"
                    >
                        {STYLE_PRESETS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1 group">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider group-hover:text-gray-400 transition-colors">Camera</label>
                    <input 
                        type="text" 
                        placeholder="e.g. 50mm"
                        value={config.cameraType}
                        onChange={(e) => setConfig({...config, cameraType: e.target.value})}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all"
                    />
                </div>

                <div className="flex flex-col gap-1 group">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider group-hover:text-gray-400 transition-colors">Lighting</label>
                    <input 
                        type="text" 
                        placeholder="e.g. soft"
                        value={config.lighting}
                        onChange={(e) => setConfig({...config, lighting: e.target.value})}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all"
                    />
                </div>
                 
                <div className="flex flex-col gap-1 group">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider group-hover:text-gray-400 transition-colors">Mood</label>
                    <input 
                        type="text" 
                        placeholder="e.g. epic"
                        value={config.mood}
                        onChange={(e) => setConfig({...config, mood: e.target.value})}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 w-full transition-all"
                    />
                </div>
            </div>
         )}

         {/* Input Bar */}
         <div className="relative group">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder={mode === 'generate' ? "Describe the image you want to create..." : "Describe how to change the image (e.g. 'Make it snowing', 'Add a cat')..."}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-4 pr-32 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none h-14 sm:h-16 custom-scrollbar transition-all group-hover:bg-gray-800/80"
            />
            <div className="absolute right-2 top-2 bottom-2 flex items-center">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || (mode === 'edit' && !uploadedImage)}
                    className={`h-full px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                        isGenerating 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white shadow-lg shadow-emerald-900/20'
                    }`}
                >
                    {isGenerating ? (
                        <><Loader2 size={16} className="animate-spin" /> Generating</>
                    ) : (
                        <><Wand2 size={16} /> {mode === 'edit' ? 'Edit' : 'Create'}</>
                    )}
                </button>
            </div>
         </div>

         {/* Error Message */}
         {error && (
            <div className="mt-2 text-red-400 text-xs flex items-center gap-1 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                {error}
            </div>
         )}
      </div>
    </div>
  );

  // -- Main Layout --
  return (
    <div className="flex h-screen w-full font-sans bg-gray-950 text-gray-100 overflow-hidden">
      {renderSidebar()}
      {renderMainArea()}
    </div>
  );
};

export default App;