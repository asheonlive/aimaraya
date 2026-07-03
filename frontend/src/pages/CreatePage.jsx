import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import PromptBox from "@/components/PromptBox";
import { Sparkles, Loader2, Download } from "lucide-react";

export default function CreatePage({ mode = "image" }) {
  const [sp] = useSearchParams();
  const preModel = sp.get("model") || undefined;
  const [result, setResult] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const [recent, setRecent] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.get("/generations").then(r => setRecent((r.data.generations || []).filter(g => g.type === mode).slice(0, 6)));
  }, [mode]);

  const isVideo = mode === "video";

  const handleResult = (gen) => {
    setResult(gen);
    setCurrentJob(null);
    setRecent(prev => [gen, ...prev.filter(item => item.id !== gen.id)].slice(0, 6));
    setTimeout(() => canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleJobUpdate = (update) => {
    if (update?.status === "running") setResult(null);
    setCurrentJob((prev) => prev?.id === update.id ? { ...prev, ...update } : { ...prev, ...update });
  };

  const previewWrapClass = isVideo ? "w-full max-w-2xl mx-auto" : "w-full max-w-3xl mx-auto";
  const canvasClass = isVideo
    ? "card-purple p-5 md:p-6 mb-6 min-h-[280px] md:min-h-[340px] flex items-center justify-center relative overflow-hidden"
    : "card-purple p-6 mb-8 min-h-[420px] flex items-center justify-center relative overflow-hidden";

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 pb-56 min-h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">// {isVideo ? "Video" : "Image"} Studio</div>
        <h1 className="font-display text-3xl tracking-tighter">Create {isVideo ? "AI Video" : "AI Image"}</h1>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className={canvasClass}>
        <div className="bg-grid absolute inset-0 opacity-20" />
        {result ? (
          <div className={`relative ${previewWrapClass}`}>
            {isVideo || result.type === "video"
              ? <video src={resolveMedia(result.media_url)} controls autoPlay loop className="w-full rounded-xl bg-black/30" data-testid="canvas-video" />
              : <img src={resolveMedia(result.media_url)} alt={result.prompt} className="w-full rounded-xl" data-testid="canvas-image" />}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-white/60">{result.prompt}</p>
              <a
                href={resolveMedia(result.media_url)}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        ) : currentJob?.status === "running" ? (
          <div className="relative text-center px-6 max-w-xl">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full gradient-purple animate-ping opacity-30" />
              <div className="absolute inset-2 rounded-full gradient-purple flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            </div>
            <div className="text-sm text-white mb-1">{currentJob.stage || "Generating..."}</div>
            <div className="text-xs text-[#a89dc9] font-mono">{Math.floor(currentJob.elapsed || 0)}s elapsed{currentJob.progress ? ` · ${currentJob.progress}%` : ""}</div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full gradient-purple transition-all duration-500" style={{ width: `${Math.max(6, Math.min(100, currentJob.progress || 6))}%` }} />
            </div>
            <div className="mt-3 text-[11px] text-white/45">{currentJob.prompt}</div>
          </div>
        ) : currentJob?.status === "error" ? (
          <div className="relative text-center px-8">
            <div className="font-display text-xl text-white/80">Generation failed</div>
            <div className="text-sm text-white/50 mt-2">{currentJob.error || "Please try again."}</div>
          </div>
        ) : (
          <div className={`relative text-center ${isVideo ? "px-6 max-w-xl" : "px-8"}`}>
            <div className="w-16 h-16 rounded-2xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-[#c084fc]" />
            </div>
            <div className="font-display text-2xl text-white/80">{isVideo ? "Ready to create video" : "Ready to create image"}</div>
            <div className="text-sm text-white/50 mt-2">
              {isVideo ? "Your final video will appear here with live status while it renders." : "Type a prompt below and hit Generate."}
            </div>
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
      <PromptBox mode={mode} onResult={handleResult} onJobUpdate={handleJobUpdate} defaultModel={preModel} />
    </div>
  );
}
