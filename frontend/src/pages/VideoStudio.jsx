import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TEMPLATES } from "@/data/templates";
import {
  Film, Music, Sliders, Play, Pause, SkipBack, SkipForward, Plus,
  Save, Eye, Download, Trash2,
} from "lucide-react";

const DEFAULT_SCENES = [
  { id: 1, cover: TEMPLATES[0].cover, prompt: TEMPLATES[0].prompt, duration: "5s", camera: "Smooth Push In" },
  { id: 2, cover: TEMPLATES[5].cover, prompt: TEMPLATES[5].prompt, duration: "5s", camera: "Aerial Pan" },
  { id: 3, cover: TEMPLATES[3].cover, prompt: TEMPLATES[3].prompt, duration: "5s", camera: "Static Wide" },
];

const CAMERA_OPTS = ["Static", "Smooth Push In", "Slow Zoom Out", "Aerial Pan", "Dolly Left", "Dolly Right", "Handheld"];

export default function VideoStudio() {
  const [scenes, setScenes] = useState(DEFAULT_SCENES);
  const [active, setActive] = useState(1);
  const [charConsistency, setCharConsistency] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [tab, setTab] = useState("scenes"); // scenes | audio | styles | settings
  const scene = scenes.find(s => s.id === active) || scenes[0];

  const addScene = () => {
    const next = { id: Date.now(), cover: TEMPLATES[scenes.length % TEMPLATES.length].cover,
                   prompt: "", duration: "5s", camera: "Smooth Push In" };
    setScenes([...scenes, next]); setActive(next.id);
  };
  const updateScene = (patch) => setScenes(scenes.map(s => s.id === active ? { ...s, ...patch } : s));
  const removeScene = (id) => {
    if (scenes.length === 1) return;
    setScenes(scenes.filter(s => s.id !== id));
    if (active === id) setActive(scenes[0].id);
  };

  const totalDur = scenes.reduce((sum, s) => sum + parseInt(s.duration), 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">Video Studio</h1>
          <p className="text-sm text-[#a89dc9]">Create cinematic videos with multi-scenes</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !py-2 text-sm inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
          <button className="btn-ghost !py-2 text-sm inline-flex items-center gap-2"><Eye className="w-4 h-4" /> Preview</button>
          <button data-testid="vs-export" className="btn-primary !py-2 text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT tab strip */}
        <div className="col-span-1 flex flex-col gap-2">
          {[
            { id: "scenes", i: Film, l: "Scenes" },
            { id: "audio", i: Music, l: "Audio" },
            { id: "styles", i: Sliders, l: "Styles" },
            { id: "settings", i: Sliders, l: "Settings" },
          ].map(({ id, i: Icon, l }) => (
            <button key={id} onClick={() => setTab(id)} data-testid={`vs-tab-${id}`} className={`flex flex-col items-center gap-1 rounded-xl py-4 text-[10px] uppercase tracking-[0.15em] border ${
              tab === id ? "border-[#a855f7] bg-[#a855f7]/15 text-white" : "border-[#2a2340] text-[#a89dc9] hover:border-[#3d3357]"
            }`}>
              <Icon className="w-5 h-5" strokeWidth={1.75} /> {l}
            </button>
          ))}
        </div>

        {/* SCENES thumbnails */}
        <div className="col-span-2 space-y-2">
          {scenes.map((s, i) => (
            <button key={s.id} onClick={() => setActive(s.id)} data-testid={`vs-scene-${i}`} className={`relative w-full rounded-xl overflow-hidden border-2 ${
              active === s.id ? "border-[#a855f7]" : "border-transparent hover:border-[#3d3357]"
            }`}>
              <div className="aspect-video">
                <img src={s.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-2 left-2 pill !py-0.5 !px-2 text-[10px]">Scene {i + 1}</div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">{s.duration}</div>
            </button>
          ))}
          <button onClick={addScene} data-testid="vs-add-scene" className="w-full py-4 rounded-xl border border-dashed border-[#a855f7]/40 text-[#c084fc] text-sm hover:bg-[#a855f7]/10 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Scene
          </button>
        </div>

        {/* PREVIEW */}
        <div className="col-span-6">
          <div className="card-purple p-4">
            <div className="aspect-video rounded-xl overflow-hidden border border-[#2a2340] relative bg-[#0d0919]">
              <img src={scene.cover} alt="" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur rounded-full px-3 py-1.5">
                  <SkipBack className="w-4 h-4" />
                  <button className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center"><Play className="w-3 h-3 text-white fill-white ml-0.5" /></button>
                  <SkipForward className="w-4 h-4" />
                  <span className="text-xs font-mono">00:04 / 00:{String(totalDur).padStart(2,"0")}</span>
                </div>
              </div>
            </div>
            {/* Timeline strip */}
            <div className="mt-4 flex gap-1 items-center">
              {scenes.map((s, i) => (
                <div key={s.id} className={`flex-1 h-16 rounded overflow-hidden border ${active === s.id ? "border-[#a855f7]" : "border-[#2a2340]"}`}>
                  <img src={s.cover} className="w-full h-full object-cover opacity-80" alt="" />
                </div>
              ))}
              <button onClick={addScene} className="w-16 h-16 rounded border border-dashed border-[#2a2340] text-[#a89dc9] flex items-center justify-center hover:border-[#a855f7]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#6b6188] mt-2">
              <span>0s</span><span>{Math.round(totalDur/2)}s</span><span>{totalDur}s</span>
            </div>
          </div>
        </div>

        {/* RIGHT scene detail */}
        <div className="col-span-3 card-purple p-5 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Scene {scenes.findIndex(s => s.id === active) + 1}</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Prompt</span>
              <button onClick={() => removeScene(active)} className="text-[#6b6188] hover:text-[#ff3b7a]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <Textarea
            value={scene.prompt}
            onChange={(e) => updateScene({ prompt: e.target.value })}
            data-testid="vs-prompt"
            className="bg-[#0d0919] border-[#2a2340] rounded-xl min-h-[110px] focus-visible:ring-[#a855f7] focus-visible:ring-1 resize-none text-xs"
          />
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Camera Movement</label>
            <select value={scene.camera} onChange={(e) => updateScene({ camera: e.target.value })} className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm">
              {CAMERA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2 block">Duration</label>
            <select value={scene.duration} onChange={(e) => updateScene({ duration: e.target.value })} className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm">
              {["3s","5s","8s","10s"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Character Consistency</div>
              <div className="text-[10px] text-[#a89dc9]">Reuse the same character across scenes</div>
            </div>
            <Switch checked={charConsistency} onCheckedChange={setCharConsistency} data-testid="vs-char-consist" />
          </div>
        </div>
      </div>

      {/* Music strip */}
      <div className="mt-6 card-purple p-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Switch checked={musicOn} onCheckedChange={setMusicOn} />
          <span className="text-sm">Music</span>
        </div>
        <select className="bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2 text-sm">
          <option>Epic Cinematic</option><option>Chill Lofi</option><option>Upbeat Pop</option><option>Ambient Space</option>
        </select>
        <div className="flex-1 h-1.5 bg-[#2a2340] rounded-full relative">
          <div className="absolute inset-y-0 left-0 w-3/5 gradient-purple rounded-full" />
        </div>
        <span className="text-xs font-mono text-[#a89dc9]">60%</span>
      </div>
    </div>
  );
}
