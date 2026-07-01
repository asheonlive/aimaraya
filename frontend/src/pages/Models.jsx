import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Lock, ArrowUpRight } from "lucide-react";

export default function Models() {
  const [models, setModels] = useState([]);
  const [tab, setTab] = useState("all");
  useEffect(() => { api.get("/models").then(r => setModels(r.data.models)); }, []);
  const filtered = models.filter(m => tab === "all" || m.type === tab);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2">// Catalog</div>
      <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-3">All AI Models</h1>
      <p className="text-[#a89dc9] max-w-xl mb-10">Every frontier model in one studio. Pricing is per-generation in credits.</p>

      <Tabs value={tab} onValueChange={setTab} className="mb-10">
        <TabsList className="bg-[#1a1530]/60 border border-[#2a2340] rounded-xl p-1 h-auto">
          {[["all","All"],["image","Image"],["video","Video"]].map(([v,l]) => (
            <TabsTrigger key={v} value={v} className="rounded-lg px-6 py-2 data-[state=active]:bg-[#a855f7] data-[state=active]:text-white text-sm">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
        {filtered.map(m => (
          <div key={m.id} data-testid={`model-card-${m.id}`} className={`card-purple p-6 hover-lift ${m.available ? "" : "opacity-70"}`}>
            <div className="flex items-start justify-between mb-6">
              <span className={`text-xs font-mono uppercase tracking-[0.2em] ${m.type === "video" ? "text-[#ff3b7a]" : "text-[#c084fc]"}`}>{m.type}</span>
              {m.available
                ? <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#34d399]"><Check className="w-3 h-3" /> Live</span>
                : <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#6b6188]"><Lock className="w-3 h-3" /> Soon</span>}
            </div>
            <h3 className="font-display text-2xl tracking-tighter mb-1">{m.name}</h3>
            <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-3">{m.category}</div>
            <p className="text-sm text-[#a89dc9] leading-relaxed mb-6 min-h-[40px]">{m.tagline}</p>
            <div className="flex items-center justify-between pt-4 border-t border-[#2a2340]">
              <span className="font-mono text-sm">{m.credits} <span className="text-[#6b6188]">credits</span></span>
              {m.available
                ? <Link to={`/app/create?model=${m.id}`} className="text-xs uppercase tracking-[0.2em] text-[#c084fc] inline-flex items-center gap-1 hover:gap-2 transition-all">Use <ArrowUpRight className="w-3 h-3" /></Link>
                : <span className="text-xs uppercase tracking-[0.2em] text-[#6b6188]">Waitlist</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
