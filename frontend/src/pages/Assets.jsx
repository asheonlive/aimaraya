import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import { Zap } from "lucide-react";

export default function Assets() {
  const [gens, setGens] = useState([]);
  useEffect(() => { api.get("/generations").then(r => setGens(r.data.generations || [])); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl tracking-tighter">My Generations</h1>
          <p className="text-sm text-[#a89dc9]">Everything you've created, in one place</p>
        </div>
        <Link to="/app/create" className="btn-primary text-sm inline-flex items-center gap-2">
          <Zap className="w-4 h-4" /> New Generation
        </Link>
      </div>
      {gens.length === 0 ? (
        <div className="card-purple py-20 text-center">
          <p className="text-[#a89dc9] mb-4">No generations yet. Time to create something.</p>
          <Link to="/app/create" className="text-[#c084fc] underline">Open Studio</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gens.map(g => (
            <div key={g.id} className="rounded-2xl overflow-hidden border border-[#2a2340] hover-lift group bg-[#0d0919]">
              <div className="aspect-square overflow-hidden">
                {g.type === "video"
                  ? <video src={resolveMedia(g.media_url)} className="w-full h-full object-cover" muted playsInline />
                  : <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
              </div>
              <div className="p-3">
                <div className="text-xs text-white/90 truncate">{g.prompt}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a89dc9] mt-1">{g.model_name} · {new Date(g.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
