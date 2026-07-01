import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CharactersModal from "@/components/CharactersModal";
import {
  Plus, X, Image as ImageIcon, Video, Music, Copy,
  Users, Clock, Maximize2, Sparkles,
} from "lucide-react";

const MODEL_SUPPORTS_IMAGE_REF = ["flux-kontext-pro", "flux-kontext-max", "flux-1.1-ultra", "flux-2-pro"];

export default function PromptBox({ mode = "image", onResult, onGenerating, defaultModel }) {
  const { user, setUser } = useAuth();
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState(defaultModel || (mode === "video" ? "vseeds" : "in2"));
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState(mode === "video" ? "9:16" : "1:1");
  const [resolution, setResolution] = useState(mode === "video" ? "720p" : "1K");
  const [quality, setQuality] = useState("High");
  const [duration, setDuration] = useState("5s");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refImage, setRefImage] = useState(null);
  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [cameraCtrl, setCameraCtrl] = useState("");
  const [character, setCharacter] = useState(null);
  const [charsOpen, setCharsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const imgFileRef = useRef(null);
  const startFileRef = useRef(null);
  const endFileRef = useRef(null);

  useEffect(() => { api.get("/models").then(r => setModels(r.data.models || [])); }, []);

  const filteredModels = models.filter(m => m.type === mode && m.available);
  const selected = models.find(m => m.id === modelId) || filteredModels[0];
  const isKlingSeedance = selected && /^(kling|seedance)/i.test(selected.id);
  const videoResolutions = isKlingSeedance ? ["480p", "720p"] : ["720p", "1080p"];
  useEffect(() => {
    if (mode === "video" && !videoResolutions.includes(resolution)) {
      setResolution(videoResolutions[videoResolutions.length - 1]);
    }
  }, [modelId, mode]);

  const videosRemaining = user?.daily_videos_remaining ?? user?.credits ?? 0;
  const modelSupportsImageRef = selected && MODEL_SUPPORTS_IMAGE_REF.includes(selected.id);
  const caps = selected?.caps || {};
  const hasImageRef = !!caps.image_ref;
  const hasStartFrame = !!caps.start_frame;
  const hasEndFrame = !!caps.end_frame;
  const hasCameraCtrl = !!caps.camera_control;
  const cameraOptions = selected?.camera_options || [];
  useEffect(() => {
    if (hasCameraCtrl && !cameraCtrl && cameraOptions.length) setCameraCtrl(cameraOptions[0]);
    if (!hasCameraCtrl) setCameraCtrl("");
    if (!hasStartFrame) setStartFrame(null);
    if (!hasEndFrame) setEndFrame(null);
  }, [modelId]);

  const uploadFile = async (f) => {
    const fd = new FormData();
    fd.append("file", f);
    const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return { url: r.data.url, name: f.name, preview: URL.createObjectURL(f) };
  };
  const handleFileGeneric = (setter) => async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setter(await uploadFile(f)); toast.success("Uploaded"); }
    catch (err) { toast.error(err.response?.data?.detail || "Upload failed"); }
  };

  useEffect(() => {
    if (loading) {
      setElapsed(0);
      const start = Date.now();
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt first");
    if (!selected) return toast.error("Pick a model");
    setElapsed(0);
    setLoading(true); onGenerating?.(true);
    try {
      const body = {
        prompt,
        model_id: selected.id,
        aspect_ratio: aspect,
        duration,
        resolution,
        ref_image_url: refImage?.url || null,
        character_id: character?.id || null,
        start_frame_url: startFrame?.url || null,
        end_frame_url: endFrame?.url || null,
        camera_control: cameraCtrl || null,
      };
      const r = await api.post("/generate", body);
      setUser({ ...user, credits: r.data.daily_videos_remaining ?? r.data.credits_remaining, daily_videos_remaining: r.data.daily_videos_remaining ?? r.data.credits_remaining, daily_video_limit: r.data.daily_video_limit ?? user.daily_video_limit });
      onResult?.(r.data.generation);
      toast.success(`Generated with ${selected.name}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Generation failed");
    } finally { setLoading(false); onGenerating?.(false); }
  };

  return (
    <>
    <div className="fixed bottom-3 right-0 z-30 mx-auto max-w-5xl px-2 sm:px-4 transition-all duration-200 ease-linear left-0 lg:left-56">
      <div className="relative flex flex-col">
        {mode === "video" && (
          <div className="flex flex-col sm:flex-row rounded-2xl sm:rounded-t-2xl sm:rounded-b-none overflow-hidden">
            {hasStartFrame && (
              <RefSlot icon={ImageIcon} label="Start Frame" limit="0/1" hint="First frame"
                preview={startFrame?.preview} onPick={() => startFileRef.current?.click()}
                onClear={() => setStartFrame(null)} />
            )}
            {hasEndFrame && (
              <>{hasStartFrame && <div className="hidden sm:block w-[1px] bg-white/10" />}
              <RefSlot icon={ImageIcon} label="End Frame" limit="0/1" hint="Last frame"
                preview={endFrame?.preview} onPick={() => endFileRef.current?.click()}
                onClear={() => setEndFrame(null)} />
              </>
            )}
            {hasImageRef && !hasStartFrame && !hasEndFrame && (
              <>
                <RefSlot icon={ImageIcon} label="Image Ref" limit="0/9" hint="Upload images"
                  preview={refImage?.preview} onPick={() => imgFileRef.current?.click()}
                  onClear={() => setRefImage(null)} />
              </>
            )}
          </div>
        )}
        <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setRefImage)} data-testid="promptbox-file" />
        <input ref={startFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setStartFrame)} data-testid="promptbox-start" />
        <input ref={endFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setEndFrame)} data-testid="promptbox-end" />

        <div className={`glass ring-1 ring-[#a855f7] p-3 sm:p-4 ${mode === "video" ? "rounded-b-2xl rounded-t-none border-t-0" : "rounded-2xl"}`}>
          <div className="flex gap-3">
            {mode === "image" && (
              <div className="flex flex-col gap-1.5">
                {refImage ? (
                  <div className="relative">
                    <img src={refImage.preview} alt="" className="w-10 h-10 rounded-md object-cover border border-[#a855f7]" />
                    <button onClick={() => setRefImage(null)} className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3b7a] rounded-full flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button data-testid="promptbox-upload-image" onClick={() => imgFileRef.current?.click()} className="w-6 h-6 rounded-md text-white/80 hover:text-[#c084fc] transition flex items-center justify-center" title="Attach reference image">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="relative flex-1">
              {character && (
                <div className="inline-flex items-center gap-1.5 mb-1 px-2 py-1 rounded-md bg-[#a855f7]/20 border border-[#a855f7]/40 text-xs text-[#c084fc]">
                  <img src={resolveMedia(character.image_url)} alt="" className="w-4 h-4 rounded-full object-cover" />
                  @{character.name}
                  <button onClick={() => setCharacter(null)} className="ml-1 text-white/60 hover:text-white"><X className="w-3 h-3" /></button>
                </div>
              )}
              <textarea
                data-testid="promptbox-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === "video" ? "Describe your cinematic scene..." : "Describe what you want in the image..."}
                rows={1}
                className="w-full pr-8 min-h-[2.5em] max-h-32 bg-transparent text-base text-white placeholder-white/50 outline-none resize-y"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Pill>
                <select value={modelId} onChange={(e) => setModelId(e.target.value)} data-testid="promptbox-model" className="bg-transparent outline-none text-sm">
                  {filteredModels.map(m => <option key={m.id} value={m.id} className="bg-[#0d0919]">{m.name}</option>)}
                </select>
              </Pill>
              <Pill>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} data-testid="promptbox-aspect" className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? ["9:16","16:9","1:1","4:3","3:4"] : ["1:1","16:9","9:16","4:5","4:3"]).map(a => <option key={a} value={a} className="bg-[#0d0919]">{a}</option>)}
                </select>
              </Pill>
              <Pill>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? videoResolutions : ["1K","2K","4K"]).map(r => <option key={r} value={r} className="bg-[#0d0919]">{r}</option>)}
                </select>
              </Pill>
              {mode === "video" && (
                <>
                  <Pill>
                    <select value={quality} onChange={(e) => setQuality(e.target.value)} className="bg-transparent outline-none text-sm">
                      {["Standard","High"].map(q => <option key={q} value={q} className="bg-[#0d0919]">{q}</option>)}
                    </select>
                  </Pill>
                  <Pill>
                    <Clock className="w-3.5 h-3.5" />
                    <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-transparent outline-none text-sm">
                      {["5s","8s","10s","12s"].map(d => <option key={d} value={d} className="bg-[#0d0919]">{d}</option>)}
                    </select>
                  </Pill>
                </>
              )}
              <button data-testid="promptbox-characters" onClick={() => setCharsOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-white/90 hover:bg-white/[0.07] transition shadow-sm text-sm font-medium">
                <Users className="w-3.5 h-3.5" /> @Characters
              </button>
              {hasCameraCtrl && (
                <Pill>
                  <select value={cameraCtrl} onChange={(e) => setCameraCtrl(e.target.value)} data-testid="promptbox-camera" className="bg-transparent outline-none text-sm">
                    {cameraOptions.map(o => <option key={o} value={o} className="bg-[#0d0919]">📹 {o}</option>)}
                  </select>
                </Pill>
              )}
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
                {mode === "video" && <span className="text-[12px] font-semibold opacity-80">{videosRemaining}/{user?.daily_video_limit ?? 12} today</span>}
              </button>
            </div>
          </div>
          {refImage && !modelSupportsImageRef && mode === "image" && (
            <div className="mt-2 text-[11px] text-amber-300/80">
              Note: {selected?.name} treats the reference as style guidance only. FLUX Kontext models use it as a full image-to-image input.
            </div>
          )}
        </div>
      </div>
    </div>
    <CharactersModal open={charsOpen} onClose={() => setCharsOpen(false)} onPick={setCharacter} />
    {loading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative flex flex-col items-center gap-4 p-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full gradient-purple animate-ping opacity-40 absolute inset-0" />
            <div className="w-20 h-20 rounded-full border-2 border-[#a855f7]/30 animate-spin absolute inset-0 border-t-[#a855f7]" />
            <div className="w-20 h-20 rounded-full bg-[#0d0919] flex items-center justify-center relative z-10">
              <Sparkles className="w-8 h-8 text-[#c084fc] animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-lg">Generating with {selected?.name}</p>
            <p className="text-[#a89dc9] text-sm mt-1">
              {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function RefSlot({ icon: Icon, label, limit, hint, preview, onPick, onClear, disabled }) {
  return (
    <div className={`glass flex grow gap-2 px-3 py-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex grow flex-col gap-0.5 min-w-24">
        <div className="flex items-center gap-2 text-white/90">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-sm font-medium flex items-center gap-1.5">
            {label}<span className="font-semibold text-white/60">({preview ? "1" : "0"}/{limit.split("/")[1]})</span>
          </span>
        </div>
        <span className="text-[13px] text-white/60">{hint}</span>
      </div>
      {preview ? (
        <div className="relative w-10 sm:w-12 aspect-square rounded-lg overflow-hidden border border-[#a855f7]">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button onClick={onClear} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <button disabled={disabled} onClick={onPick} className="flex aspect-square w-10 sm:w-12 items-center justify-center rounded-lg border-2 border-dashed border-white/25 bg-white/5 hover:border-[#a855f7]/50 hover:bg-[#a855f7]/10 transition disabled:cursor-not-allowed">
          <Plus className="w-4 h-4 text-white/80" />
        </button>
      )}
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
