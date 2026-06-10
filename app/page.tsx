"use client";

import { useState } from "react";
import { 
  Sparkles, Image as ImageIcon, Sliders, Download, RefreshCw, 
  Paintbrush, Zap, History, Wand2, TerminalSquare, Maximize
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CanvasEditor from "@/components/CanvasEditor";

const SUGGESTED_PROMPTS = [
  {
    title: "Cinematic Portrait",
    prompt: "A cinematic medium-shot portrait of an elderly weathered fisherman, detailed wrinkles, sea salt in his gray beard, wearing a classic dark yellow waterproof rain jacket. Standing on a wooden dock at dawn, thick morning fog and moody atmosphere. Overcast soft lighting, shot on 85mm lens, photorealistic, 8k resolution."
  },
  {
    title: "Cyberpunk Sci-Fi",
    prompt: "A sleek futuristic cybernetic owl perched on a neon-lit metal railing, intricate mechanical feathers made of carbon fiber and polished chrome, glowing teal optical lenses for eyes. Background of a rainy, crowded Neo-Tokyo street filled with holographic advertisements. Cyberpunk aesthetic, octane render."
  },
  {
    title: "Epic Fantasy Landscape",
    prompt: "A massive ancient stone castle built into the side of a towering, snow-capped mountain peak. A majestic waterfall cascades from the castle gates into a lush, emerald-green valley below. Golden hour sunset casting warm orange light across the clouds. Ethereal, grand scale, fantasy concept art, cinematic."
  }
];

type GenerationRecord = {
  url: string;
  prompt: string;
};

export default function Home() {
  const [activeMode, setActiveMode] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [upscaling, setUpscaling] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.output) {
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        
        if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
          setGeneratedImage(imageUrl);
          setHistory((prev) => [{ url: imageUrl, prompt }, ...prev]);
        } else {
          console.error("Unrecognized image format:", data.output);
          alert("Generation succeeded, but the image URL format was unrecognized.");
        }
      } else {
        alert(data.error || "Failed to generate image.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("A network error occurred while generating.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!generatedImage) return;
    
    setUpscaling(true);
    
    try {
      const response = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: generatedImage }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.output) {
        setGeneratedImage(data.output);
        // Add the upscaled version to history as well
        setHistory((prev) => [{ url: data.output, prompt: `[UPSCALED] ${prompt}` }, ...prev]);
      } else {
        alert(data.error || "Failed to upscale image.");
      }
    } catch (error) {
      console.error("Upscale failed:", error);
      alert("A network error occurred while upscaling.");
    } finally {
      setUpscaling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-gray-950 to-black font-sans text-slate-200">
      <main className="flex-grow p-4 md:p-8">
        <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Zap size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              NEXUS<span className="text-cyan-400 font-light">.STUDIO</span>
            </h1>
          </div>

          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode("generate")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMode === "generate"
                  ? "bg-slate-800 text-cyan-400 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Sparkles size={16} /> Generate
            </button>
            <button
              onClick={() => setActiveMode("edit")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMode === "edit"
                  ? "bg-slate-800 text-violet-400 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Paintbrush size={16} /> Inpaint Editor
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeMode === "generate" ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-fit glow-border">
                    <form onSubmit={handleGenerate} className="space-y-6">
                      <div>
                        <label className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-2">
                          <TerminalSquare size={14} className="text-cyan-400" /> Prompt Blueprint
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the image you want to create in vivid detail..."
                          className="w-full h-40 bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 resize-none font-sans shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-2">
                          <Sliders size={14} className="text-violet-400" /> Aspect Ratio
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["1:1", "16:9", "9:16"].map((ratio) => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setAspectRatio(ratio)}
                              className={`py-2 text-xs font-mono border rounded-lg transition-all ${
                                aspectRatio === ratio
                                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || upscaling || !prompt}
                        className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium py-3.5 px-4 rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Synthesizing Latent Space...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Generate Matrix
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-8 flex flex-col justify-center items-center min-h-[500px] bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 relative overflow-hidden shadow-2xl">
                    {loading || upscaling ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                        <p className="text-xs font-mono text-slate-400 tracking-widest animate-pulse">
                          {upscaling ? "ENHANCING RESOLUTION" : "RENDERING CONTEXT"}
                        </p>
                      </div>
                    ) : generatedImage ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-full max-h-[600px] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] group"
                      >
                        <img 
                          src={generatedImage} 
                          alt="AI Generation" 
                          className="object-contain max-h-[550px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 justify-between duration-300">
                          <span className="text-xs font-mono text-slate-300 truncate max-w-[60%]">{prompt}</span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpscale}
                              disabled={upscaling || loading}
                              className="p-2 bg-slate-900 border border-slate-700 hover:border-violet-500 hover:text-violet-400 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-xs font-medium"
                              title="Upscale 4x"
                            >
                              <Maximize size={16} />
                              <span className="hidden sm:inline">Upscale</span>
                            </button>
                            <a
                              href={generatedImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-900 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 rounded-lg text-cyan-500 transition-colors"
                              title="Open full resolution in new tab to save"
                            >
                              <Download size={18} />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">Canvas Vacant</p>
                        <p className="text-xs text-slate-600 max-w-[280px]">Input your programmatic prompt instruction matrix to forge pixels.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Wand2 size={14} className="text-violet-400" /> Prompt Inspiration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {SUGGESTED_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(item.prompt)}
                        className="text-left p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group"
                      >
                        <h4 className="text-sm font-bold text-slate-300 group-hover:text-cyan-400 transition-colors mb-2">{item.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-3">{item.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                      <History size={14} className="text-cyan-400" /> Session History
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {history.map((record, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 aspect-square bg-slate-900">
                          <img src={record.url} alt={`History ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 cursor-pointer" onClick={() => setGeneratedImage(record.url)}>
                            <p className="text-[10px] text-center text-slate-300 line-clamp-4 leading-tight">{record.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CanvasEditor />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Zap size={16} />
            <span className="text-sm font-mono tracking-widest">NEXUS<span className="text-cyan-500/50">.STUDIO</span></span>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            POWERED BY STABILITY AI & REPLICATE
          </div>
        </div>
      </footer>
    </div>
  );
}