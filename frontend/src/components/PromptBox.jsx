import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CharactersModal from "@/components/CharactersModal";
import {
  Plus, X, Image as ImageIcon, Video, Music, Copy,
  Users, Clock, Maximize2, Sparkles,
} from "lucide-react";

export default function PromptBox({ mode = "image", onResult, onGenerating, onJobUpdate, defaultModel }) {
  const { user, setUser } = useAuth();
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState(defaultModel || (mode === "video" ? "vseeds" : "in2"));
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState(mode === "video" ? "9:16" : "1:1");
  const [resolution, setResolution] = useState(mode === "video" ? "720p" : "1K");
  const [quality, setQuality] = useState("High");
  const [duration, setDuration] = useState("5s");
  const [count, setCount] = useState(1);
  const [refImage, setRefImage] = useState(null);
  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [cameraCtrl, setCameraCtrl] = useState("");
  const [character, setCharacter] = useState(null);
  const [charsOpen, setCharsOpen] = useState(false);
  const [motionVideo, setMotionVideo] = useState(null);
  const [motionImage, setMotionImage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const imgFileRef = useRef(null);
  const startFileRef = useRef(null);
  const endFileRef = useRef(null);
  const motionVideoRef = useRef(null);
  const motionImageRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  useEffect(() => { api.get("/models").then(r => { setModels(r.data.models || []); setModelsLoaded(true); }); }, []);

  const filteredModels = models.filter(m => m.type === mode && m.available);
  useEffect(() => {
    const ids = filteredModels.map(m => m.id);
    if (modelId && !ids.includes(modelId) && ids.length) setModelId(ids[0]);
  }, [mode, models.length]);
  const selected = models.find(m => m.id === modelId) || null;
  const videoResolutions = selected?.resolutions?.length ? selected.resolutions : ["720p"];
  const videoDurations = selected?.durations?.length ? selected.durations : ["5s", "8s", "10s", "12s"];
  const imageResolutions = selected?.resolutions?.length ? selected.resolutions : ["1K", "2K", "4K"];
  useEffect(() => {
    if (mode === "video" && !videoResolutions.includes(resolution) && videoResolutions.length) {
      setResolution(videoResolutions[videoResolutions.length - 1]);
    }
    if (mode === "video" && !videoDurations.includes(duration) && videoDurations.length) {
      setDuration(videoDurations[0]);
    }
  }, [modelId, mode, selected?.id]);

  const videosRemaining = user?.daily_videos_remaining ?? user?.credits ?? 0;
  const caps = selected?.caps || {};
  const hasImageRef = !!caps.image_ref || !!caps.reference_images;
  const hasStartFrame = !!caps.start_frame;
  const hasEndFrame = !!caps.end_frame;
  const hasCameraCtrl = !!caps.camera_control;
  const hasMotionCtrl = !!caps.motion;
  const cameraOptions = selected?.camera_options || [];
  useEffect(() => {
    if (hasCameraCtrl && !cameraCtrl && cameraOptions.length) setCameraCtrl(cameraOptions[0]);
    if (!hasCameraCtrl) setCameraCtrl("");
    if (!hasImageRef) setRefImage(null);
    if (!hasStartFrame) setStartFrame(null);
    if (!hasEndFrame) setEndFrame(null);
  }, [modelId, hasImageRef, hasStartFrame, hasEndFrame, hasCameraCtrl]);

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

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  useEffect(() => {
    if (!jobs.length) return;
    const id = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.status !== "running") return j;
        const next = { ...j, elapsed: (j.elapsed || 0) + 0.25 };
        onJobUpdate?.({ id: next.id, elapsed: next.elapsed, status: next.status, stage: next.stage, progress: next.progress, prompt: next.prompt, model: next.model });
        return next;
      }));
    }, 250);
    return () => clearInterval(id);
  }, [!!jobs.length]);

  const patchJob = (id, patch) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
    onJobUpdate?.({ id, ...patch });
  };

  const parseResponsePayload = async (response) => {
    const text = await response.text();
    if (!text) {
      return { detail: response.ok ? "" : `Empty response from server (${response.status})` };
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        detail: text.startsWith("<")
          ? `Server returned HTML instead of JSON (${response.status})`
          : text.slice(0, 240),
      };
    }
  };

  const pollJob = async (jobId, localId, meta) => {
    while (true) {
      const res = await fetch(resolveMedia(`/api/jobs/${jobId}`), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("maraya_token") || ""}`,
        },
      });
      const job = await parseResponsePayload(res);
      if (!res.ok) {
        throw new Error(job.detail || "Could not read generation status.");
      }
      patchJob(localId, {
        status: job.status === "failed" ? "error" : job.status,
        stage: job.stage || "Generating",
        progress: Number(job.progress || 0),
        provider: job.provider || meta.provider || "",
      });
      if (job.status === "completed") {
        const generation = {
          id: job.id || jobId,
          prompt: meta.prompt,
          model_id: meta.modelId,
          model_name: meta.modelName,
          type: meta.type,
          media_url: job.resultUrl || job.fileUrl || "",
        };
        patchJob(localId, { status: "completed", progress: 100, stage: "Done", media_url: generation.media_url });
        onResult?.(generation);
        return generation;
      }
      if (job.status === "failed") {
        throw new Error(job.error || "Generation failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt first");
    if (!selected) return toast.error("Pick a model");
      const token = localStorage.getItem("maraya_token");
      if (!token) return toast.error("Please log in again");
    const localId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setJobs(prev => [...prev, { id: localId, model: selected.name, prompt: prompt.slice(0, 80), status: "running", stage: "Uploading", progress: 0, elapsed: 0, media_url: null }]);
    onJobUpdate?.({ id: localId, status: "running", stage: "Uploading", progress: 0, elapsed: 0, model: selected.name, prompt: prompt.slice(0, 80), media_url: null });
    onGenerating?.(true);
    try {
      const fd = new FormData();
      fd.append("category", mode);
      fd.append("modelKey", selected.id);
      fd.append("prompt", prompt);
      fd.append("duration", duration);
      fd.append("aspect", aspect);
      fd.append("resolution", resolution);
      const jobMode = startFrame?.url || endFrame?.url ? "frames" : (character?.id && mode === "video" ? "character" : (refImage?.url ? "refs" : "text"));
      fd.append("mode", jobMode);
      const slotKinds = [];
      const characterImage = character?.image_url ? { url: character.image_url, name: `${character.name || "character"}.png` } : null;
      for (const [kind, item] of [
        [jobMode === "character" ? "character" : "", jobMode === "character" ? characterImage : null],
        ["start", startFrame],
        ["ref", refImage],
        ["end", endFrame],
      ]) {
        if (!item?.url) continue;
        const response = await fetch(resolveMedia(item.url));
        const blob = await response.blob();
        fd.append("files", new File([blob], item.name || "reference.png", { type: blob.type || "application/octet-stream" }));
        slotKinds.push(kind);
      }
      if (slotKinds.length) fd.append("slotKinds", slotKinds.join(","));
      patchJob(localId, { stage: "Queued", progress: 3 });
      const created = await fetch(resolveMedia("/api/jobs"), {
        method: "POST",
        body: fd,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const createdJson = await parseResponsePayload(created);
      if (!created.ok) {
        throw new Error(createdJson.detail || "Could not start generation.");
      }
      if (!createdJson?.jobId) {
        throw new Error(createdJson.detail || "Server did not return a job id.");
      }
      const generation = await pollJob(createdJson.jobId, localId, { prompt, modelId: selected.id, modelName: selected.name, type: mode, provider: "" });
      try {
        const me = await api.get("/auth/me");
        setUser(me.data.user);
      } catch {}
      toast.success(`Generated with ${selected.name}`);
      setTimeout(() => setJobs(prev => prev.filter(j => j.id !== localId)), 8000);
      onJobUpdate?.({ id: localId, status: "completed", stage: "Done", progress: 100, media_url: generation.media_url, model: selected.name, prompt: prompt.slice(0, 80) });
    } catch (e) {
      const message = e?.message || e.response?.data?.detail || "Generation failed";
      patchJob(localId, { status: "error", stage: "Failed", error: message });
      toast.error(message);
      setTimeout(() => setJobs(prev => prev.filter(j => j.id !== localId)), 5000);
      onJobUpdate?.({ id: localId, status: "error", stage: "Failed", error: message, model: selected.name, prompt: prompt.slice(0, 80) });
    } finally { onGenerating?.(false); }
  };

  return (
    <>
    <div className="fixed bottom-3 right-0 z-30 mx-auto max-w-4xl px-2 sm:px-4 transition-all duration-200 ease-linear left-0 lg:left-56">
      <div className="relative flex flex-col">
        {mode === "video" && (
          <div className="flex flex-col sm:flex-row rounded-2xl sm:rounded-t-2xl sm:rounded-b-none overflow-hidden">
            {hasMotionCtrl && (
              <>
                <RefSlot icon={Video} label="Motion Video" limit="0/1" hint="Source video"
                  preview={motionVideo?.preview} onPick={() => motionVideoRef.current?.click()}
                  onClear={() => setMotionVideo(null)} />
                <div className="hidden sm:block w-[1px] bg-white/10" />
                <RefSlot icon={ImageIcon} label="Character Image" limit="0/1" hint="Character to animate"
                  preview={motionImage?.preview} onPick={() => motionImageRef.current?.click()}
                  onClear={() => setMotionImage(null)} />
              </>
            )}
            {!hasMotionCtrl && hasImageRef && (
              <RefSlot icon={ImageIcon} label="Image Ref" limit="0/9" hint="Upload images"
                preview={refImage?.preview} onPick={() => imgFileRef.current?.click()}
                onClear={() => setRefImage(null)} />
            )}
            {!hasMotionCtrl && hasStartFrame && (
              <><div className="hidden sm:block w-[1px] bg-white/10" />
              <RefSlot icon={ImageIcon} label="Start Frame" limit="0/1" hint="First frame"
                preview={startFrame?.preview} onPick={() => startFileRef.current?.click()}
                onClear={() => setStartFrame(null)} />
              </>
            )}
            {!hasMotionCtrl && hasEndFrame && (
              <>{<div className="hidden sm:block w-[1px] bg-white/10" />}
              <RefSlot icon={ImageIcon} label="End Frame" limit="0/1" hint="Last frame"
                preview={endFrame?.preview} onPick={() => endFileRef.current?.click()}
                onClear={() => setEndFrame(null)} />
              </>
            )}
          </div>
        )}
        <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setRefImage)} data-testid="promptbox-file" />
        <input ref={startFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setStartFrame)} data-testid="promptbox-start" />
        <input ref={endFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setEndFrame)} data-testid="promptbox-end" />
        <input ref={motionVideoRef} type="file" accept="video/*" className="hidden" onChange={handleFileGeneric(setMotionVideo)} data-testid="promptbox-motion-video" />
        <input ref={motionImageRef} type="file" accept="image/*" className="hidden" onChange={handleFileGeneric(setMotionImage)} data-testid="promptbox-motion-image" />

        <div className={`glass ring-1 ring-[#a855f7] p-3 sm:p-4 ${mode === "video" ? "rounded-b-2xl rounded-t-none border-t-0" : "rounded-2xl"}`}>
          <div className="flex gap-3">
            {mode === "image" && hasImageRef && (
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
                  {filteredModels.reduce((groups, m) => {
                    const g = m.group || m.name.split(" ")[0];
                    if (!groups.find(x => x.group === g)) groups.push({ group: g, models: [] });
                    groups.find(x => x.group === g).models.push(m);
                    return groups;
                  }, []).map(grp => (
                    <optgroup key={grp.group} label={grp.group} className="bg-[#0d0919]">
                      {grp.models.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#0d0919]">{m.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Pill>
              <Pill>
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} data-testid="promptbox-aspect" className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? ["9:16","16:9","1:1","4:3","3:4"] : ["1:1","16:9","9:16","4:5","4:3"]).map(a => <option key={a} value={a} className="bg-[#0d0919]">{a}</option>)}
                </select>
              </Pill>
              <Pill>
                <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="bg-transparent outline-none text-sm">
                  {(mode === "video" ? videoResolutions : imageResolutions).map(r => <option key={r} value={r} className="bg-[#0d0919]">{r}</option>)}
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
                      {videoDurations.map(d => <option key={d} value={d} className="bg-[#0d0919]">{d}</option>)}
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
                data-testid="promptbox-generate"
                className="group flex h-[34px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg gradient-purple hover:opacity-90 px-4 text-sm text-white"
              >
                <span className="truncate">Generate</span>
                {mode === "video" && <span className="text-[12px] font-semibold opacity-80">{videosRemaining}/{user?.daily_video_limit ?? 12} today</span>}
              </button>
            </div>
          </div>
          {refImage && !hasImageRef && mode === "image" && (
            <div className="mt-2 text-[11px] text-amber-300/80">
              Note: {selected?.name} treats the reference as style guidance only. FLUX Kontext models use it as a full image-to-image input.
            </div>
          )}
        </div>
      </div>
    </div>
    {jobs.length > 0 && (
      <div className="fixed bottom-24 left-0 right-0 z-40 mx-auto max-w-4xl px-2 sm:px-4 lg:left-56">
        <div className="flex flex-col gap-2">
          {jobs.map(j => (
            <div key={j.id} className={`glass rounded-xl px-4 py-3 flex items-center gap-3 ${j.status === "completed" ? "border-l-4 border-l-emerald-500" : j.status === "error" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-[#a855f7]"}`}>
              {j.status === "running" ? (
                <div className="relative w-8 h-8 shrink-0">
                  <div className="w-8 h-8 rounded-full border-2 border-[#a855f7]/30 animate-spin border-t-[#a855f7]" />
                </div>
              ) : j.status === "completed" ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{j.model}</div>
                <div className="text-xs text-white/60 truncate">{j.stage || j.prompt}</div>
              </div>
              <div className="text-xs text-white/50 shrink-0">
                {j.status === "running" && `${Math.floor(j.elapsed)}s${j.progress ? ` · ${j.progress}%` : ""}`}
                {j.status === "completed" && "Done!"}
                {j.status === "error" && "Failed"}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    <CharactersModal open={charsOpen} onClose={() => setCharsOpen(false)} onPick={setCharacter} />
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
