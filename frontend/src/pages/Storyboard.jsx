import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Sparkles, Loader2, Wand2, Video, Download, Film, Clapperboard, Play,
} from "lucide-react";

const STYLES = ["cinematic", "anime", "photorealistic", "3D animation", "watercolor", "noir"];
const IMAGE_MODELS = [
  { id: "gpt-image-1",     label: "GPT Image 1 · 5cr",     credits: 5 },
  { id: "flux-1.1-ultra",  label: "FLUX 1.1 Ultra · 3cr",  credits: 3 },
  { id: "ideogram-v4",     label: "Ideogram V4 · 3cr",     credits: 3 },
  { id: "recraft-v4",      label: "Recraft V4 · 3cr",      credits: 3 },
  { id: "seedream-v2",     label: "Seedream 2 · 3cr",      credits: 3 },
  { id: "grok-image",      label: "Grok Imagine · 3cr",    credits: 3 },
  { id: "stability-ultra", label: "Stability Ultra · 4cr", credits: 4 },
];
const VIDEO_MODELS = [
  { id: "seedance-fast", label: "Seedance Fast · 5s" },
  { id: "seedance-pro",  label: "Seedance Pro · 5s" },
  { id: "kling-omni",    label: "Kling 3 Omni · 5s" },
  { id: "veo-2",         label: "Veo 2 · 5s" },
  { id: "hailuo",        label: "MiniMax Hailuo · 6s" },
];

export default function Storyboard() {
  const { user, setUser } = useAuth();
  const [concept, setConcept] = useState("A luxury real estate walkthrough of a modern villa at sunset — kitchen, living room, bedroom, terrace, hero exterior.");
  const [panels, setPanels] = useState(6);
  const [style, setStyle] = useState("cinematic");
  const [videoModel, setVideoModel] = useState("seedance-fast");
  const [imageModel, setImageModel] = useState("gpt-image-1");
  const [autoAnimate, setAutoAnimate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [story, setStory] = useState(null);

  const doAnimate = async (storyId) => {
    setAnimating(true);
    try {
      const r = await api.post(`/storyboard/${storyId}/animate`, { video_model: videoModel });
      setStory(r.data.storyboard);
      setUser({ ...user, credits: r.data.credits_remaining });
      toast.success("Videos ready — hover a panel to preview");
    } catch (e) {
      // On timeout, poll the storyboard directly
      const msg = e.response?.data?.detail;
      try {
        const s = await api.get(`/storyboards/${storyId}`);
        setStory(s.data.storyboard);
        const done = (s.data.storyboard.panels || []).filter(p => p.video_url).length;
        if (done > 0) toast.success(`${done} videos ready`);
        else toast.error(msg || "Animate failed");
      } catch { toast.error(msg || "Animate failed"); }
    } finally { setAnimating(false); }
  };

  const generate = async () => {
    if (!concept.trim()) return toast.error("Describe your concept first");
    setBusy(true); setStory(null);
    try {
      const r = await api.post("/storyboard", { concept, panels, style, image_model: imageModel });
      setStory(r.data.storyboard);
      setUser({ ...user, credits: r.data.credits_remaining });
      const ok = (r.data.storyboard.panels || []).filter(p => p.media_url).length;
      toast.success(`Storyboard ready · ${ok} panels`);
      setBusy(false);
      if (autoAnimate && ok > 0) {
        await doAnimate(r.data.storyboard.id);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Storyboard failed");
      setBusy(false);
    }
  };

  const animate = async () => {
    if (!story) return;
    await doAnimate(story.id);
  };

  const estImage = (IMAGE_MODELS.find(m => m.id === imageModel)?.credits || 5) * panels + 2;
  const validPanels = (story?.panels || []).filter(p => p.media_url).length;
  const videoCost = validPanels * (VIDEO_MODELS.find(v => v.id === videoModel) ? 6 : 6);

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">// Storyboard Agent</div>
          <h1 className="font-display text-3xl tracking-tighter">AI Storyboard</h1>
        </div>
      </div>
      <p className="text-sm text-[#a89dc9] mb-8 max-w-2xl">
        Type a concept, the agent breaks it into shots, and GPT Image 1 draws every panel. Then hit <span className="text-[#c084fc]">Animate All</span> and every panel becomes a video — automatically.
      </p>

      {/* CONTROL PANEL */}
      <div className="card-purple p-6 mb-8 space-y-5">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Concept</label>
          <textarea
            data-testid="story-concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="w-full bg-[#0d0919] border border-[#2a2340] focus:border-[#a855f7] rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[100px]"
            placeholder="Describe your story or scene..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Panels</label>
            <div className="flex gap-1">
              {[4,5,6,7,8].map(n => (
                <button key={n} onClick={() => setPanels(n)} data-testid={`story-panels-${n}`} className={`flex-1 py-2 text-sm font-mono rounded-lg border ${panels === n ? "border-[#a855f7] bg-[#a855f7]/20" : "border-[#2a2340] text-[#a89dc9] hover:border-[#3d3357]"}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} data-testid="story-style" className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm">
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Image Model</label>
            <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} data-testid="story-imagemodel" className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm">
              {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Animate with</label>
            <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} data-testid="story-videomodel" className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm">
              {VIDEO_MODELS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[#a89dc9]">Est. cost: <span className="text-[#c084fc] font-mono">{estImage} credits</span> for {panels} panels{autoAnimate && <span> + <span className="text-emerald-400 font-mono">{4 * panels} credits</span> animation</span>}</div>
            <label className="flex items-center gap-2 text-xs text-[#a89dc9] cursor-pointer select-none" data-testid="story-autoanimate">
              <input type="checkbox" checked={autoAnimate} onChange={(e) => setAutoAnimate(e.target.checked)} className="w-4 h-4 rounded border-[#2a2340] bg-[#0d0919] accent-[#a855f7]" />
              <span>Auto-animate every panel into video after generation</span>
            </label>
          </div>
          <button data-testid="story-generate" onClick={generate} disabled={busy || animating} className="btn-primary text-sm inline-flex items-center gap-2">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Drawing panels…</> :
             animating ? <><Loader2 className="w-4 h-4 animate-spin" /> Animating…</> :
             <><Wand2 className="w-4 h-4" /> {autoAnimate ? "Generate Full Video Storyboard" : "Generate Storyboard"}</>}
          </button>
        </div>
      </div>

      {/* PANELS */}
      {busy && (
        <div className="card-purple py-16 text-center">
          <Loader2 className="w-10 h-10 text-[#a855f7] animate-spin mx-auto mb-3" />
          <div className="text-white">Agent is drawing your storyboard…</div>
          <div className="text-xs text-[#a89dc9] mt-1 font-mono">Panels generate in parallel · ~30-60s{autoAnimate && " (video step runs after)"}</div>
        </div>
      )}

      {animating && !busy && !story?.panels?.some(p => p.video_url) && (
        <div className="card-purple py-12 text-center mb-6" data-testid="story-animating-banner">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <div className="text-white">Animating {validPanels} panels into video…</div>
          <div className="text-xs text-[#a89dc9] mt-1 font-mono">Using {VIDEO_MODELS.find(v => v.id === videoModel)?.label} · running in parallel</div>
        </div>
      )}

      {story && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">// {story.panels.length} panels · {story.concept.slice(0, 60)}...</div>
              <div className="font-display text-2xl tracking-tighter mt-1">Your storyboard</div>
            </div>
            <button data-testid="story-animate" onClick={animate} disabled={animating || validPanels === 0} className="btn-primary text-sm inline-flex items-center gap-2">
              {animating ? <><Loader2 className="w-4 h-4 animate-spin" /> Animating {validPanels} panels…</> : <><Film className="w-4 h-4" /> Animate All ({6 * validPanels} credits)</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {story.panels.map(p => (
              <div key={p.id} className="card-purple overflow-hidden hover-lift">
                <div className="aspect-video bg-[#0d0919] relative">
                  {p.video_url ? (
                    <video src={resolveMedia(p.video_url)} controls loop className="w-full h-full object-cover" data-testid={`panel-video-${p.index}`} />
                  ) : p.media_url ? (
                    <>
                      <img src={resolveMedia(p.media_url)} alt="" className="w-full h-full object-cover" />
                      {animating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="w-8 h-8 text-[#a855f7] animate-spin" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-red-300">Panel generation failed</div>
                  )}
                  <div className="absolute top-2 left-2 pill !py-0.5 !px-2 text-[10px]">Shot {p.index}</div>
                  {p.video_url && (
                    <a href={resolveMedia(p.video_url)} download className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center hover:bg-[#a855f7]"><Download className="w-3 h-3" /></a>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-white/70 line-clamp-3">{p.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!story && !busy && (
        <div className="text-center py-12 text-[#a89dc9] text-sm">
          Your generated storyboard will appear here.
        </div>
      )}
    </div>
  );
}
