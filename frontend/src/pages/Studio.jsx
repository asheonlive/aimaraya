import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Download, Loader2, ImageIcon, History } from "lucide-react";

const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export default function Studio() {
  const { user, setUser, refresh } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(sp.get("model") || "nano-banana");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) { nav("/auth"); return; }
    api.get("/models").then(r => setModels(r.data.models));
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try { const r = await api.get("/generations"); setHistory(r.data.generations); } catch {}
  };

  const selectedModel = models.find(m => m.id === model);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Add a prompt first"); return; }
    if (!selectedModel?.available) { toast.error(`${selectedModel?.name || "This model"} is launching soon. Try Nano Banana.`); return; }
    setLoading(true); setResult(null);
    try {
      const r = await api.post("/generate", { prompt, model_id: model, aspect_ratio: ratio });
      setResult(r.data.generation);
      setUser({ ...user, credits: r.data.credits_remaining });
      toast.success("Generation complete");
      loadHistory();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation failed");
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-[#27272A] min-h-[calc(100vh-4rem)]">
      {/* LEFT PANEL */}
      <aside className="lg:col-span-3 bg-[#050505] p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// MODEL</div>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger data-testid="studio-model-select" className="bg-[#0f0f10] border-[#27272A] rounded-none h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f10] border-[#27272A] rounded-none">
              {models.map(m => (
                <SelectItem key={m.id} value={m.id} disabled={!m.available} className="rounded-none">
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{m.name}</span>
                    <span className="text-[10px] font-mono text-[#A1A1AA]">{m.credits}CR {m.available ? "" : "· SOON"}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <p className="text-xs text-[#A1A1AA] mt-2">{selectedModel.tagline}</p>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// PROMPT</div>
          <Textarea
            data-testid="studio-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A neon-lit Tokyo street in pouring rain, cinematic 35mm, ultra-detailed..."
            className="bg-[#0f0f10] border-[#27272A] rounded-none min-h-[140px] resize-none focus-visible:ring-[#E1FF01] focus-visible:ring-1"
          />
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// ASPECT RATIO</div>
          <div className="grid grid-cols-5 gap-1">
            {RATIOS.map(r => (
              <button
                key={r}
                data-testid={`studio-ratio-${r}`}
                onClick={() => setRatio(r)}
                className={`py-2 text-xs font-mono border ${ratio === r ? "border-[#E1FF01] text-[#E1FF01]" : "border-[#27272A] text-[#A1A1AA] hover:border-white/30"}`}
              >{r}</button>
            ))}
          </div>
        </div>

        <Button
          data-testid="studio-generate-btn"
          onClick={handleGenerate}
          disabled={loading}
          className="bg-[#E1FF01] text-black hover:bg-[#C8E600] rounded-none h-14 text-base font-medium tracking-tight"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate · {selectedModel?.credits ?? "-"} CR</>}
        </Button>
        <div className="text-xs text-[#A1A1AA] -mt-3">Balance: <span className="text-[#E1FF01] font-mono">{user.credits}</span> credits</div>
      </aside>

      {/* CENTER CANVAS */}
      <section className="lg:col-span-6 bg-[#0a0a0a] p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative w-full max-w-2xl aspect-square border border-[#27272A] bg-[#050505] flex items-center justify-center">
          {loading && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#E1FF01] animate-spin mx-auto mb-4" />
              <div className="text-sm text-[#A1A1AA] font-mono">Synthesizing pixels…</div>
            </div>
          )}
          {!loading && result && (
            <img src={resolveMedia(result.media_url)} alt={result.prompt} data-testid="studio-result-image" className="w-full h-full object-contain" />
          )}
          {!loading && !result && (
            <div className="text-center px-8">
              <ImageIcon className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
              <div className="font-display text-2xl tracking-tight text-[#A1A1AA]">Your canvas awaits.</div>
              <div className="text-sm text-[#52525B] mt-2">Describe what you want to see. We'll bring it to life.</div>
            </div>
          )}
        </div>
        {result && (
          <a href={resolveMedia(result.media_url)} download target="_blank" rel="noreferrer" data-testid="studio-download" className="mt-6 inline-flex items-center gap-2 border border-[#27272A] hover:border-[#E1FF01] px-6 py-3 text-sm">
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </section>

      {/* RIGHT PANEL */}
      <aside className="lg:col-span-3 bg-[#050505] p-6 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">
          <History className="w-3 h-3" /> History
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-[#52525B]">No generations yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map(g => (
              <button key={g.id} onClick={() => setResult(g)} data-testid={`history-${g.id}`} className="block w-full text-left group">
                <div className="aspect-square overflow-hidden border border-[#27272A] group-hover:border-[#E1FF01]">
                  <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-[#A1A1AA] mt-1 truncate">{g.prompt}</div>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
