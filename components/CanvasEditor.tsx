"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, Paintbrush, Loader2, Trash2, RefreshCw } from "lucide-react";

export default function CanvasEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Hidden canvas for pure B&W mask
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Initialize both canvases when an image is uploaded
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Setup visible canvas
        canvas.width = 1024; // Use target SDXL resolution
        canvas.height = 1024;
        ctx.drawImage(img, 0, 0, 1024, 1024);

        // 2. Setup hidden offscreen mask canvas
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = 1024;
        maskCanvas.height = 1024;
        const maskCtx = maskCanvas.getContext("2d");
        if (maskCtx) {
          maskCtx.fillStyle = "black"; // Base layer is solid black
          maskCtx.fillRect(0, 0, 1024, 1024);
        }
        maskCanvasRef.current = maskCanvas;

        // Save states
        setOriginalImageUrl(event.target?.result as string);
        setImageLoaded(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    if (canvas) canvas.getContext("2d")?.beginPath();
    if (maskCanvas) maskCanvas.getContext("2d")?.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    const rect = canvas.getBoundingClientRect();
    
    // Scale coordinate math matching the 1024x1024 canvas resolution
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // --- Draw Translucent Mask Layer on Visible Canvas ---
    ctx.lineWidth = 45;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(6, 182, 212, 0.5)"; // Modern glowing cyan overlay
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // --- Draw Pure White Mask Layer on Secret Inpainting Canvas ---
    maskCtx.lineWidth = 45;
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.strokeStyle = "white"; // Replicate target regions must be white
    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    maskCtx.beginPath();
    maskCtx.moveTo(x, y);
  };

  // Reset the mask overlays completely without losing the background image
  const clearMask = () => {
    if (!originalImageUrl || !canvasRef.current || !maskCanvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      ctx?.drawImage(img, 0, 0, 1024, 1024);

      const maskCtx = maskCanvasRef.current?.getContext("2d");
      if (maskCtx) {
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(0, 0, 1024, 1024);
      }
    };
    img.src = originalImageUrl;
  };

  // Fire payloads over to the updated Replicate api router
  const handleEdit = async () => {
    if (!canvasRef.current || !maskCanvasRef.current || !prompt || !originalImageUrl) return;
    setLoading(true);

    try {
      // Export mask as standard Base64 Data URL
      const maskDataUrl = maskCanvasRef.current.toDataURL("image/png");

      const response = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          init_image: originalImageUrl, // Clean original asset
          mask_image: maskDataUrl,      // B&W target mask coordinates
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.output && data.output.length > 0) {
        setResultImage(data.output[0]);
      } else {
        alert(data.error || "Inpainting processing failed.");
      }
    } catch (err) {
      console.error("Failed to edit via backend stream:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-slate-900/40 backdrop-blur-md border border-slate-900/60 rounded-2xl shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Interactive Canvas Interface */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-900 p-4 relative min-h-[450px]">
          {!imageLoaded && (
            <label className="flex flex-col items-center cursor-pointer text-slate-400 hover:text-cyan-400 transition-colors py-12 w-full text-center">
              <Upload size={36} className="mb-3 text-slate-500" />
              <span className="font-mono text-sm tracking-wider">Upload Base Matrix Image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
          
          <div className="relative w-full max-w-[480px] aspect-square">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
              className={`w-full h-full border border-slate-800 rounded-lg shadow-inner cursor-crosshair object-cover ${!imageLoaded ? 'hidden' : 'block'}`}
            />
          </div>
          
          {imageLoaded && (
            <div className="w-full flex justify-between items-center mt-4 px-1">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/90">
                <Paintbrush size={12} /> Brush active over canvas surface
              </div>
              <button 
                onClick={clearMask}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 bg-slate-900 border border-slate-800 rounded-md"
              >
                <Trash2 size={12} /> Clear Current Mask
              </button>
            </div>
          )}
        </div>

        {/* Right: Operational Configuration Panels */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 tracking-widest uppercase">Inpainting Target Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what should replace the painted region..."
                className="w-full h-28 bg-slate-950/80 border border-slate-900 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none shadow-inner"
              />
            </div>

            <button
              onClick={handleEdit}
              disabled={loading || !imageLoaded || !prompt}
              className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Paintbrush size={18} />}
              {loading ? "Re-rendering Mask Matrices..." : "Apply AI Inpainting"}
            </button>
          </div>

          {/* Render Output Workspace */}
          {resultImage && (
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-cyan-500/20 shadow-2xl animate-fade-in">
              <span className="block text-xs font-mono text-cyan-400 mb-2 text-center tracking-widest uppercase">Generation Complete</span>
              <img src={resultImage} alt="Inpainted Output" className="w-full rounded-lg border border-slate-900 object-cover aspect-square" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}