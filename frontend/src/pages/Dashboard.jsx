import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TEMPLATES } from "@/data/templates";
import { CountUp, Skeleton, PageFade } from "@/components/motion";
import {
  Image as ImageIcon, Video, LayoutGrid, Wand2, Plus, ArrowRight, TrendingUp,
  Sparkles, Clock, Zap, Clapperboard,
} from "lucide-react";

const QUICK = [
  { to: "/app/create-image", i: Wand2, t: "AI Image", d: "Text → Image · 26 models", grad: "from-fuchsia-500/40 to-pink-500/10" },
  { to: "/app/create-video", i: Video, t: "AI Video", d: "Text → Video · Sora 2", grad: "from-indigo-500/40 to-blue-500/10" },
  { to: "/app/storyboard", i: Clapperboard, t: "Storyboard Agent", d: "Concept → 6 shots → video", grad: "from-violet-500/40 to-purple-500/10", badge: "NEW" },
  { to: "/app/templates", i: LayoutGrid, t: "Templates", d: "1000+ ready-made presets", grad: "from-amber-500/40 to-orange-500/10" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [gens, setGens] = useState(null);
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  });
  useEffect(() => { api.get("/generations").then(r => setGens(r.data.generations || [])); }, []);
  const trending = TEMPLATES.slice(0, 5);

  const stats = [
    { label: "Videos left today", value: user.daily_videos_remaining ?? user.credits ?? 0, format: (v) => `${v}/${user.daily_video_limit ?? 12}`, accent: true },
    { label: "Generations", value: gens?.length || 0, format: (v) => v.toString() },
    { label: "Models unlocked", value: 30, format: (v) => v.toString() },
  ];

  return (
    <PageFade>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2">// {greeting}</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter mb-1">Hey {user.name}<span className="ml-2">👋</span></h1>
        <p className="text-[#a89dc9] mb-10">What will we create today?</p>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {stats.map(s => (
            <div key={s.label} className={`card-purple p-5 ${s.accent ? "relative overflow-hidden" : ""}`}>
              {s.accent && <div className="absolute inset-0 gradient-purple opacity-10" />}
              <div className="relative">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#a89dc9] mb-2">{s.label}</div>
                <div className={`font-display text-3xl md:text-4xl tracking-tighter ${s.accent ? "gradient-text" : ""}`}>
                  <CountUp to={s.value} format={s.format} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick create */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 stagger">
          {QUICK.map(({ to, i: Icon, t, d, grad, badge }) => (
            <Link to={to} key={t} data-testid={`quick-${t.toLowerCase().replace(/\s+/g,'-')}`} className="hover-lift card-tilt">
              <div className={`relative rounded-2xl border border-[#a855f7]/20 bg-gradient-to-br ${grad} p-5 h-40 flex flex-col justify-between overflow-hidden group`}>
                <div className="absolute inset-0 bg-[#07050f]/40" />
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full gradient-purple opacity-20 group-hover:opacity-40 transition-opacity" />
                {badge && <span className="absolute top-3 right-3 gradient-purple text-white text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full z-10">{badge}</span>}
                <Icon className="w-6 h-6 text-white relative" strokeWidth={1.75} />
                <div className="relative">
                  <div className="font-medium">{t}</div>
                  <div className="text-xs text-white/70 mt-0.5">{d}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1">// Your library</div>
            <h2 className="font-display text-2xl tracking-tighter">Recent Generations</h2>
          </div>
          <Link to="/app/generations" className="text-xs text-[#c084fc] hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-14">
          {gens === null && Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
          {gens?.slice(0, 4).map(g => (
            <div key={g.id} className="aspect-[3/4] rounded-xl overflow-hidden border border-[#2a2340] relative group card-tilt">
              {g.type === "video"
                ? <video src={resolveMedia(g.media_url)} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                : <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[#07050f] to-transparent">
                <div className="text-[10px] text-white/70 truncate">{g.model_name}</div>
              </div>
            </div>
          ))}
          {gens?.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <div key={`ph-${i}`} className="aspect-[3/4] rounded-xl border border-dashed border-[#2a2340] flex items-center justify-center">
              <span className="text-xs text-[#6b6188]">Empty</span>
            </div>
          ))}
          <Link to="/app/create-image" data-testid="dash-new" className="aspect-[3/4] rounded-xl border border-[#a855f7]/40 gradient-purple-soft flex flex-col items-center justify-center hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 gradient-purple opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-7 h-7 text-white mb-2 relative z-10 group-hover:rotate-90 transition-transform" />
            <span className="text-xs text-white relative z-10">Create New</span>
          </Link>
        </div>

        {/* Trending templates */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1">// Popular</div>
            <h2 className="font-display text-2xl tracking-tighter flex items-center gap-2">Trending Templates <TrendingUp className="w-5 h-5 text-[#c084fc]" /></h2>
          </div>
          <Link to="/app/templates" className="text-xs text-[#c084fc] hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {trending.map(t => (
            <Link key={t.id} to={`/app/create-video?template=${t.id}`} className="group card-tilt">
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#2a2340] relative">
                <img src={t.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07050f] via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                  <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center">
                    <Video className="w-4 h-4 text-black ml-0.5" />
                  </div>
                </div>
                <span className="absolute top-2 right-2 pill !py-0.5 !px-2 text-[10px]">{t.duration}</span>
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <div className="text-sm text-white font-medium">{t.title}</div>
                  <div className="text-[10px] text-[#a89dc9]">{t.category}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
