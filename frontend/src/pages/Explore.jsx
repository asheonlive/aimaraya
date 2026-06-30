import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Explore() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/explore").then(r => setItems(r.data.generations)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// COMMUNITY</div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-10">Explore the feed.</h1>
      {items.length === 0 ? (
        <p className="text-[#A1A1AA]">Be the first to create something memorable. The feed will populate as the community generates.</p>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map(g => (
            <div key={g.id} className="break-inside-avoid border border-[#27272A] hover:border-[#E1FF01] hover-lift">
              <img src={g.media_url} alt={g.prompt} className="w-full" />
              <div className="p-3">
                <div className="text-xs text-[#A1A1AA] line-clamp-2">{g.prompt}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#52525B] mt-1">{g.model_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
