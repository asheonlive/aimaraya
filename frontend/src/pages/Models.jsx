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
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// CATALOG</div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-4">The model library.</h1>
      <p className="text-[#A1A1AA] max-w-xl mb-10">Browse every model integrated into Maraya. Pricing is per generation in credits.</p>

      <Tabs value={tab} onValueChange={setTab} className="mb-10">
        <TabsList data-testid="models-tabs" className="bg-transparent border border-[#27272A] rounded-none p-0 h-auto">
          {[["all","All"],["image","Image"],["video","Video"]].map(([v,l]) => (
            <TabsTrigger key={v} value={v} data-testid={`models-tab-${v}`} className="rounded-none border-r border-[#27272A] last:border-r-0 px-6 py-3 data-[state=active]:bg-[#E1FF01] data-[state=active]:text-black text-sm">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
        {filtered.map(m => (
          <div key={m.id} data-testid={`model-card-${m.id}`} className={`border ${m.available ? "border-[#E1FF01]/40" : "border-[#27272A]"} bg-[#0f0f10] p-6 hover-lift hover:border-[#E1FF01] relative`}>
            <div className="flex items-start justify-between mb-6">
              <span className={`text-xs font-mono uppercase tracking-[0.2em] ${m.type === "video" ? "text-[#FF3B30]" : "text-[#E1FF01]"}`}>{m.type}</span>
              {m.available ? (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#34C759]"><Check className="w-3 h-3" /> Live</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#52525B]"><Lock className="w-3 h-3" /> Soon</span>
              )}
            </div>
            <h3 className="font-display text-2xl tracking-tighter mb-1">{m.name}</h3>
            <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">{m.category}</div>
            <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6 min-h-[40px]">{m.tagline}</p>
            <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
              <span className="font-mono text-sm">{m.credits} <span className="text-[#52525B]">credits</span></span>
              {m.available ? (
                <Link to={`/studio?model=${m.id}`} className="text-xs uppercase tracking-[0.2em] text-[#E1FF01] hover:gap-2 inline-flex items-center gap-1">
                  Use <ArrowUpRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-xs uppercase tracking-[0.2em] text-[#52525B]">Waitlist</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
