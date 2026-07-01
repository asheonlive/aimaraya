import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TEMPLATES } from "@/data/templates";
import { Image as ImageIcon, Video, LayoutGrid, Wand2, Plus, ArrowRight } from "lucide-react";

const QUICK = [
  { to: "/app/create", i: Wand2, t: "AI Image", d: "Generate stunning images", grad: "from-fuchsia-500/30 to-pink-500/10" },
  { to: "/app/video-studio", i: Video, t: "AI Video", d: "Create cinematic videos", grad: "from-indigo-500/30 to-blue-500/10" },
  { to: "/app/video-studio", i: LayoutGrid, t: "Video Studio", d: "Multi-scene composer", grad: "from-emerald-500/30 to-teal-500/10" },
  { to: "/app/templates", i: ImageIcon, t: "Templates", d: "1000+ starting points", grad: "from-amber-500/30 to-orange-500/10" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [gens, setGens] = useState([]);
  useEffect(() => { api.get("/generations").then(r => setGens(r.data.generations || [])); }, []);

  const trending = TEMPLATES.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-[#a89dc9]">// Welcome back</div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tighter mb-1">Hey {user.name} 👋</h1>
      <p className="text-[#a89dc9] mb-8">What will we create today?</p>

      <div className="mb-10">
        <div className="relative">
          <input placeholder="Search templates, tools or your generations..." className="w-full bg-[#1a1530]/60 border border-[#2a2340] focus:border-[#a855f7]/60 rounded-2xl px-5 py-4 text-sm placeholder:text-[#6b6188] outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 stagger">
        {QUICK.map(({ to, i: Icon, t, d, grad }) => (
          <Link to={to} key={t} data-testid={`quick-${t.toLowerCase().replace(/\s+/g,'-')}`} className="hover-lift">
            <div className={`relative rounded-2xl border border-[#a855f7]/20 bg-gradient-to-br ${grad} p-5 h-40 flex flex-col justify-between overflow-hidden`}>
              <div className="absolute inset-0 bg-[#07050f]/40" />
              <Icon className="w-6 h-6 text-white relative" strokeWidth={1.75} />
              <div className="relative">
                <div className="font-medium">{t}</div>
                <div className="text-xs text-white/70 mt-0.5">{d}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* RECENT GENERATIONS */}
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-2xl tracking-tighter">Recent Generations</h2>
        <Link to="/app/generations" className="text-xs text-[#c084fc] hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-14">
        {gens.slice(0, 4).map(g => (
          <div key={g.id} className="aspect-[3/4] rounded-xl overflow-hidden border border-[#2a2340] relative group">
            <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-[#07050f] to-transparent text-[10px] text-white/70 truncate">
              {new Date(g.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - gens.length) }).map((_, i) => (
          <div key={`ph-${i}`} className="aspect-[3/4] rounded-xl border border-dashed border-[#2a2340] flex items-center justify-center">
            <span className="text-xs text-[#6b6188]">Empty slot</span>
          </div>
        ))}
        <Link to="/app/create" data-testid="dash-new" className="aspect-[3/4] rounded-xl border border-[#a855f7]/40 gradient-purple-soft flex flex-col items-center justify-center hover-lift">
          <Plus className="w-6 h-6 text-[#c084fc] mb-1" />
          <span className="text-xs text-[#c084fc]">Create New</span>
        </Link>
      </div>

      {/* TRENDING TEMPLATES */}
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-2xl tracking-tighter">Trending Templates</h2>
        <Link to="/app/templates" className="text-xs text-[#c084fc] hover:text-white flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {trending.map(t => (
          <Link key={t.id} to={`/app/create?template=${t.id}`} className="group">
            <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#2a2340] relative">
              <img src={t.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center">
                  <Video className="w-4 h-4 text-black ml-0.5" />
                </div>
              </div>
              <span className="absolute top-2 right-2 pill !py-0.5 !px-2 text-[10px]">{t.duration}</span>
            </div>
            <div className="mt-2 text-sm">{t.title}</div>
            <div className="text-xs text-[#a89dc9]">{t.category}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
