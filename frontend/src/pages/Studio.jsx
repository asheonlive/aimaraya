import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { TEMPLATES } from "@/data/templates";
import {
  Sparkles, Download, Loader2, Image as ImageIcon, Upload, RefreshCw,
  ChevronDown, ChevronUp, Wand2,
} from "lucide-react";

const RATIOS = ["9:16", "1:1", "4:5", "16:9", "4:3"];
const STYLES = [
  { id: "none", label: "None", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200" },
  { id: "cinematic", label: "Cinematic", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200" },
  { id: "photoreal", label: "Photoreal", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200" },
  { id: "vibrant", label: "Vibrant", img: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=200" },
];

export default function Studio() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [models, setModels] = useState([]);
  const [outputType, setOutputType] = useState("image"); // image | video
  const [modelId, setModelId] = useState("nano-banana");
  const [prompt, setPrompt] = useState("A futuristic luxury villa by the ocean at sunset, cinematic lighting, ultra realistic, highly detailed");
  const [ratio, setRatio] = useState("16:9");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("5s");
  const [seed, setSeed] = useState(0);
  const [negative, setNegative] = useState("");
  const [motion, setMotion] = useState([50]);
  const [showAdv, setShowAdv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/models").then(r => setModels(r.data.models));
    // apply template if given
    const tplId = sp.get("template");
    if (tplId) {
      const t = TEMPLATES.find(x => x.id === tplId);
      if (t) {
        setPrompt(t.prompt);
        setOutputType(t.type);
        if (t.model) setModelId(t.model);
      }
    }
  }, []);

  const filtered = models.filter(m => m.type === outputType && m.available);
  const selected = models.find(m => m.id === modelId) || filtered[0];

  useEffect(() => {
    if (selected && selected.type !== outputType) {
      const first = filtered[0];
      if (first) setModelId(first.id);
    }
  }, [outputType, models]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt first");
    if (!selected) return toast.error("Pick a model");
    setLoading(true); setResult(null);
    try {
      const r = await api.post("/generate", { prompt, model_id: selected.id, aspect_ratio: ratio });
      setResult(r.data.generation);
      setUser({ ...user, credits: r.data.credits_remaining });
      toast.success(`Generated with ${selected.name}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation failed");
    } finally { setLoading(false); }
  };

  const isVideo = result?.type === "video";

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tighter mb-1">
          AI {outputType === "video" ? "Video" : "Image"} Generator
        </h1>
        <p className="text-sm text-[#a89dc9]">Turn your ideas into stunning {outputType === "video" ? "videos" : "images"}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: controls */}
        <div className="card-purple p-6 space-y-6">
          <Tabs value={outputType} onValueChange={setOutputType}>
            <TabsList className="bg-[#1a1530] rounded-xl p-1 h-auto w-full grid grid-cols-2">
              <TabsTrigger value="image" data-testid="studio-tab-image" className="rounded-lg data-[state=active]:bg-[#a855f7] data-[state=active]:text-white">
                <ImageIcon className="w-4 h-4 mr-2" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" data-testid="studio-tab-video" className="rounded-lg data-[state=active]:bg-[#a855f7] data-[state=active]:text-white">
                <Wand2 className="w-4 h-4 mr-2" /> Video
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Prompt</label>
            <Textarea
              data-testid="studio-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-[#0d0919] border-[#2a2340] rounded-xl min-h-[120px] focus-visible:ring-[#a855f7] focus-visible:ring-1 resize-none"
              placeholder="Describe what you want to see..."
            />
            <div className="text-[10px] text-[#6b6188] mt-1 text-right font-mono">{prompt.length}/1500</div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 border border-dashed border-[#2a2340] hover:border-[#a855f7]/50 rounded-xl py-3 text-sm text-[#a89dc9] hover:text-white transition">
            <Upload className="w-4 h-4" /> Upload Image (Optional)
          </button>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Model</label>
            <Select value={selected?.id} onValueChange={setModelId}>
              <SelectTrigger data-testid="studio-model-select" className="bg-[#0d0919] border-[#2a2340] rounded-xl h-12">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0919] border-[#2a2340]">
                {filtered.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{m.name}</span>
                      <span className="text-[10px] font-mono text-[#a89dc9]">{m.credits}CR</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && <p className="text-xs text-[#a89dc9] mt-1.5">{selected.tagline}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {RATIOS.map(r => (
                <button
                  key={r}
                  data-testid={`studio-ratio-${r}`}
                  onClick={() => setRatio(r)}
                  className={`py-3 text-xs font-mono rounded-lg border transition ${
                    ratio === r
                      ? "border-[#a855f7] bg-[#a855f7]/20 text-white"
                      : "border-[#2a2340] text-[#a89dc9] hover:border-[#3d3357]"
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>

          {outputType === "video" && (
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {["5s", "10s", "15s"].map(d => (
                  <button key={d} onClick={() => setDuration(d)} className={`py-3 text-xs font-mono rounded-lg border transition ${
                    duration === d ? "border-[#a855f7] bg-[#a855f7]/20 text-white" : "border-[#2a2340] text-[#a89dc9] hover:border-[#3d3357]"
                  }`}>{d}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Styles</label>
            <div className="grid grid-cols-4 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`rounded-xl overflow-hidden border-2 aspect-square transition ${
                    style === s.id ? "border-[#a855f7]" : "border-transparent hover:border-[#3d3357]"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07050f] to-transparent" />
                    <span className="absolute bottom-1 inset-x-0 text-[10px] text-white text-center">{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ADVANCED */}
          <div>
            <button onClick={() => setShowAdv(!showAdv)} data-testid="studio-adv-toggle" className="w-full flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#a89dc9] py-2">
              <span>Advanced Settings</span>
              {showAdv ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showAdv && (
              <div className="space-y-4 pt-3 border-t border-[#2a2340]">
                <div>
                  <label className="text-xs text-[#a89dc9] mb-1 block">Seed</label>
                  <input type="number" value={seed} onChange={(e) => setSeed(+e.target.value)} className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#a89dc9] mb-2 block">Motion Strength: {motion[0]}</label>
                  <Slider value={motion} onValueChange={setMotion} max={100} step={5} />
                </div>
                <div>
                  <label className="text-xs text-[#a89dc9] mb-1 block">Negative Prompt</label>
                  <input value={negative} onChange={(e) => setNegative(e.target.value)} placeholder="Things to avoid..." className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
          </div>

          <Button
            data-testid="studio-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-14 gradient-purple hover:opacity-90 rounded-xl text-base font-medium"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate ({selected?.credits ?? "-"} credits)</>}
          </Button>
        </div>

        {/* RIGHT: preview */}
        <div className="card-purple p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="pill text-[10px]">Generation</span>
            {selected && <span className="text-xs text-[#a89dc9] font-mono">{selected.name}</span>}
          </div>
          <div className="flex-1 min-h-[500px] bg-[#0d0919] rounded-xl border border-[#2a2340] flex items-center justify-center relative overflow-hidden">
            <div className="bg-grid absolute inset-0 opacity-30" />
            {loading && (
              <div className="relative text-center px-6">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full gradient-purple animate-ping opacity-30" />
                  <div className="absolute inset-2 rounded-full gradient-purple flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-sm text-white mb-1">Creating your {outputType}…</div>
                <div className="text-xs text-[#a89dc9] font-mono">This may take {outputType === "video" ? "30-90s" : "10-20s"}</div>
              </div>
            )}
            {!loading && result && (
              isVideo ? (
                <video src={resolveMedia(result.media_url)} controls autoPlay loop className="max-w-full max-h-full" data-testid="studio-result-video" />
              ) : (
                <img src={resolveMedia(result.media_url)} alt={result.prompt} data-testid="studio-result-image" className="max-w-full max-h-full object-contain" />
              )
            )}
            {!loading && !result && (
              <div className="relative text-center px-8">
                <div className="w-14 h-14 rounded-2xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-[#c084fc]" />
                </div>
                <div className="font-display text-xl text-white/80">Your creation appears here</div>
                <div className="text-xs text-[#6b6188] mt-2">Enter a prompt and click Generate</div>
              </div>
            )}
          </div>
          {result && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              <a href={resolveMedia(result.media_url)} download target="_blank" rel="noreferrer" data-testid="studio-download" className="btn-ghost !py-2 text-xs text-center inline-flex items-center justify-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
              <button onClick={handleGenerate} className="btn-ghost !py-2 text-xs inline-flex items-center justify-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button className="btn-ghost !py-2 text-xs inline-flex items-center justify-center gap-1">Upscale</button>
              <button className="btn-ghost !py-2 text-xs inline-flex items-center justify-center gap-1">Publish</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
