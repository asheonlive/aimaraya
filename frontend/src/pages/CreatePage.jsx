import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import PromptBox from "@/components/PromptBox";
import { Sparkles, Loader2 } from "lucide-react";

/** Simplified generator page (Image or Video) matching ArtCraft's canvas + floating prompt UX. */
export default function CreatePage({ mode = "image" }) {
  const [sp] = useSearchParams();
  const preModel = sp.get("model") || undefined;
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.get("/generations").then(r => setRecent((r.data.generations || []).filter(g => g.type === mode).slice(0, 6)));
  }, [mode]);

  const isVideo = mode === "video";

  const handleResult = (gen) => {
    setResult(gen);
    setTimeout(() => canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 pb-56 min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">// {isVideo ? "Video" : "Image"} Studio</div>
        <h1 className="font-display text-3xl tracking-tighter">Create {isVideo ? "AI Video" : "AI Image"}</h1>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="card-purple p-6 mb-8 min-h-[420px] flex items-center justify-center relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-20" />
        {result ? (
          <div className="relative w-full max-w-3xl mx-auto">
            {isVideo || result.type === "video"
              ? <video src={resolveMedia(result.media_url)} controls autoPlay loop className="w-full rounded-xl" data-testid="canvas-video" />
              : <img src={resolveMedia(result.media_url)} alt={result.prompt} className="w-full rounded-xl" data-testid="canvas-image" />}
            <p className="text-xs text-white/60 mt-3 text-center">{result.prompt}</p>
          </div>
        ) : (
          <div className="relative text-center px-8">
            <div className="w-16 h-16 rounded-2xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-[#c084fc]" />
            </div>
            <div className="font-display text-2xl text-white/80">Ready to create magic</div>
            <div className="text-sm text-white/50 mt-2">Type a prompt below and hit Generate</div>
          </div>
        )}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">Recent {isVideo ? "videos" : "images"}</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {recent.map(g => (
              <button key={g.id} onClick={() => setResult(g)} className="aspect-square rounded-lg overflow-hidden border border-white/[0.06] hover:border-[#a855f7]/50 transition">
                {g.type === "video"
                  ? <video src={resolveMedia(g.media_url)} className="w-full h-full object-cover" muted playsInline />
                  : <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating prompt */}
      <PromptBox mode={mode} onResult={handleResult} defaultModel={preModel} />
    </div>
  );
}
