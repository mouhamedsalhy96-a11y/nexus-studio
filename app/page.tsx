"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, Sliders, Download, RefreshCw, Paintbrush, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CanvasEditor from "@/components/CanvasEditor";

export default function Home() {
  // App State
  const [activeMode, setActiveMode] = useState<"generate" | "edit">("generate");

  // Generation State
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    setGeneratedImage(null); // Clear previous image

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.output) {
        // Safely extract the URL whether Replicate returns an array or a direct string
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        
        if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
          setGeneratedImage(imageUrl);
        } else {
          console.error("Unrecognized image format received:", data.output);
          alert("Generation succeeded, but the image URL format was unrecognized.");
        }
      } else {
        console.error("API Error:", data.error);
        alert(data.error || "Failed to generate image.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("A network error occurred while generating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-gray-950 to-black p-4 md:p-8 font-sans">
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            NEXUS<span className="text-cyan-400 font-light">.STUDIO</span>
          </h1>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMode("generate")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMode === "generate"
                ? "bg-slate-800 text-cyan-400 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Sparkles size={16} />
            Generate
          </button>
          <button
            onClick={() => setActiveMode("edit")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMode === "edit"
                ? "bg-slate-800 text-violet-400 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Paintbrush size={16} />
            Inpaint Editor
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeMode === "generate" ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Controls Panel */}
              <div className="lg:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-fit glow-border">
                <form onSubmit={handleGenerate} className="space-y-6">
                  <div>
                    <label className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-cyan-400" /> Prompt Blueprint
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Cyberpunk netrunner overlooking a neon metropolis, cinematic lighting, 8k resolution..."
                      className="w-full h-32 bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 resize-none font-sans shadow-inner"
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
                    disabled={loading || !prompt}
                    className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium py-3 px-4 rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Synthesizing Latent Space...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        Generate Matrix
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Viewport Canvas */}
              <div className="lg:col-span-8 flex flex-col justify-center items-center min-h-[500px] bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 relative overflow-hidden shadow-2xl">
                
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <p className="text-xs font-mono text-slate-400 tracking-widest animate-pulse">RENDERING CONTEXT</p>
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
                      onError={() => alert("The image finished generating, but failed to load on the screen. Check your browser console.")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 justify-between duration-300">
                      <span className="text-xs font-mono text-slate-300 truncate max-w-[70%]">{prompt}</span>
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
  );
}