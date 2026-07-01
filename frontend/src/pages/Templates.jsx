import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/data/templates";
import { Search, Play, Sparkles } from "lucide-react";
import { PageFade } from "@/components/motion";

export default function Templates() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const filtered = TEMPLATES.filter(t =>
    (cat === "All" || t.category === cat) &&
    (!q || t.title.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageFade>
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
      <div className="mb-2">
        <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1">// Marketplace</div>
        <h1 className="font-display text-3xl tracking-tighter">Templates</h1>
        <p className="text-sm text-[#a89dc9]">Ready-made presets. Click any → auto-fills your studio.</p>
      </div>

      <div className="my-6 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6188]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates..." data-testid="templates-search" className="w-full bg-[#1a1530]/60 border border-[#2a2340] focus:border-[#a855f7]/60 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-[#6b6188] outline-none transition-all" />
        </div>
        <select className="bg-[#1a1530]/60 border border-[#2a2340] rounded-xl px-4 py-2.5 text-sm">
          <option>Sort: Popular</option><option>Newest</option><option>Duration</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {TEMPLATE_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} data-testid={`tpl-cat-${c.toLowerCase().replace(/\s+/g,'-')}`} className={`px-4 py-1.5 rounded-full text-xs transition-all ${
            cat === c
              ? "gradient-purple text-white shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)]"
              : "bg-[#1a1530]/60 border border-[#2a2340] text-[#a89dc9] hover:text-white hover:border-[#a855f7]/40"
          }`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
        {filtered.map(t => (
          <Link key={t.id} to={`/app/create-${t.type === "video" ? "video" : "image"}?template=${t.id}`} data-testid={`tpl-${t.id}`} className="group hover-lift card-tilt">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-[#2a2340] relative">
              <img src={t.cover} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07050f] via-[#07050f]/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 text-black fill-black ml-1" />
                </div>
              </div>
              <span className="absolute top-2 right-2 pill !py-0.5 !px-2 text-[10px]">{t.duration}</span>
              <span className="absolute top-2 left-2 text-[10px] text-white/80 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {t.model}
              </span>
              <div className="absolute bottom-0 inset-x-0 p-3">
                <div className="text-sm text-white font-medium truncate">{t.title}</div>
                <div className="text-[10px] text-[#a89dc9]">{t.category}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-20 text-[#a89dc9]">No templates found.</div>
      )}
    </div>
    </PageFade>
  );
}
