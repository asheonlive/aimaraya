import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Plus, Image as ImageIcon, Video, Music, Copy, Coins, Users, ChevronDown,
  Clock, Maximize2,
} from "lucide-react";

/**
 * Floating prompt box (bottom of screen) matching ArtCraft's layout.
 * mode: "video" | "image"
 */
export default function PromptBox({ mode = "image", onResult, defaultModel }) {
  const { user, setUser } = useAuth();
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState(defaultModel || (mode === "video" ? "seedance-pro" : "nano-banana"));
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState(mode === "video" ? "9:16" : "1:1");
  const [resolution, setResolution] = useState(mode === "video" ? "1080p" : "1K");
  const [quality, setQuality] = useState("High");
  const [duration, setDuration] = useState("12s");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/models").then(r => setModels(r.data.models || [])); }, []);
  const filteredModels = models.filter(m => m.type === mode && m.available);
  const selected = models.find(m => m.id === modelId) || filteredModels[0];
  const cost = (selected?.credits || 0) * count * (mode === "video" ? parseInt(duration) || 1 : 1);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt first");
    if (!selected) return toast.error("Pick a model");
    setLoading(true);
    try {
      const r = await api.post("/generate", { prompt, model_id: selected.id, aspect_ratio: aspect });
      setUser({ ...user, credits: r.data.credits_remaining });
      onResult?.(r.data.generation);
      toast.success(`Generated with ${selected.name}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-3 right-0 z-30 mx-auto max-w-5xl px-2 sm:px-4 transition-all duration-200 ease-linear left-0 lg:left-56">
      <div className="relative flex flex-col">
        {/* Reference tabs — video only */}
        {mode === "video" && (
          <div className="flex flex-col sm:flex-row rounded-2xl sm:rounded-t-2xl sm:rounded-b-none overflow-hidden">
            <ReferenceSlot icon={ImageIcon} label="Image Ref" limit="0/9" hint="Upload images" />
            <div className="hidden sm:block w-[1px] bg-white/10" />
            <ReferenceSlot icon={Video} label="Video Ref" limit="0/3" hint="0/15s" />
            <div className="hidden sm:block w-[1px] bg-white/10" />
            <ReferenceSlot icon={Music} label="Audio Ref" limit="0/3" hint="0/15s" />
          </div>
        )}

        {/* Prompt input */}
        <div className={`glass ring-1 ring-[#a855f7] p-3 sm:p-4 ${mode === "video" ? "rounded-b-2xl rounded-t-none border-t-0" : "rounded-2xl"}`}>
          <div className="flex gap-3">
            {mode === "image" && (
              <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/80 hover:text-[#c084fc] transition">
                <Plus className="w-4 h-4" />
              </button>
            )}
            <div className="relative flex-1">
              <textarea
                data-testid="promptbox-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "video" ? "Describe your cinematic scene..." : "Describe what you want in the image..."}
                rows={1}
                className="w-full pr-8 min-h-[2.5em] max-h-32 bg-transparent text-base text-white placeholder-white/50 outline-none resize-y"
              />
              <button className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/90">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Pill>
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} data-testid="promptbox-model" className="bg-transparent outline-none text-sm">
                  {filteredModels.map(m => <option key={m.id} value={m.id} className="bg-[#0d0919]">{m.name}</option>)}
                </select>
              </Pill>
              <Pill>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} data-testid="promptbox-aspect" className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? ["9:16","16:9","1:1","4:3","3:4"] : ["1:1","16:9","9:16","4:5","4:3"]).map(a => <option key={a} value={a} className="bg-[#0d0919]">{a}{a === "9:16" ? " (Tall)" : a === "1:1" ? " Square" : ""}</option>)}
                </select>
              </Pill>
              <Pill>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? ["720p","1080p"] : ["1K","2K","4K"]).map(r => <option key={r} value={r} className="bg-[#0d0919]">{r}</option>)}
                </select>
              </Pill>
              {mode === "video" && (
                <>
                  <Pill>
                    <select value={quality} onChange={(e) => setQuality(e.target.value)} className="bg-transparent outline-none text-sm">
                      {["Low","Standard","High"].map(q => <option key={q} value={q} className="bg-[#0d0919]">{q}</option>)}
                    </select>
                  </Pill>
                  <Pill>
                    <Clock className="w-3.5 h-3.5" />
                    <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-transparent outline-none text-sm">
                      {["5s","8s","10s","12s","15s"].map(d => <option key={d} value={d} className="bg-[#0d0919]">{d}</option>)}
                    </select>
                  </Pill>
                </>
              )}
              <Pill><Users className="w-3.5 h-3.5" /> @Characters</Pill>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              <Pill>
                <Copy className="w-3.5 h-3.5" />
                <input type="number" min={1} max={4} value={count} onChange={(e) => setCount(+e.target.value || 1)} className="w-8 bg-transparent text-sm outline-none" />
              </Pill>
              <button
                onClick={handleGenerate}
                disabled={loading}
                data-testid="promptbox-generate"
                className="group flex h-[34px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg gradient-purple hover:opacity-90 px-4 text-sm text-white disabled:opacity-50"
              >
                <span className="truncate">{loading ? "Generating..." : "Generate"}</span>
                <span className="flex items-center gap-1 opacity-80" title={`${cost} credits`}>
                  <Coins className="w-3 h-3" />
                  <span className="text-[13px] font-bold">{cost}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferenceSlot({ icon: Icon, label, limit, hint }) {
  return (
    <div className="glass flex grow gap-2 px-3 py-2">
      <div className="flex grow flex-col gap-0.5 min-w-24">
        <div className="flex items-center gap-2 text-white/90">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-sm font-medium flex items-center gap-1.5">
            {label}<span className="font-semibold text-white/60">({limit})</span>
          </span>
        </div>
        <span className="text-[13px] text-white/60">{hint}</span>
      </div>
      <button className="flex aspect-square w-10 sm:w-12 items-center justify-center rounded-lg border-2 border-dashed border-white/25 bg-white/5 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/10 transition">
        <Plus className="w-4 h-4 text-white/80" />
      </button>
    </div>
  );
}

function Pill({ children }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-white/90 hover:bg-white/[0.07] transition shadow-sm text-sm font-medium">
      {children}
    </div>
  );
}
