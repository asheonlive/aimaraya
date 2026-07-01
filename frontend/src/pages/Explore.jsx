import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";

export default function Explore() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/explore").then(r => setItems(r.data.generations || [])); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2">// Community feed</div>
      <h1 className="font-display text-4xl md:text-5xl tracking-tighter mb-10">Explore</h1>
      {items.length === 0 ? (
        <p className="text-[#a89dc9]">The feed is empty. Be the first to publish something memorable.</p>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map(g => (
            <div key={g.id} className="break-inside-avoid rounded-2xl overflow-hidden border border-[#2a2340] hover-lift bg-[#0d0919]">
              {g.type === "video"
                ? <video src={resolveMedia(g.media_url)} className="w-full" muted playsInline />
                : <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full" />}
              <div className="p-3">
                <div className="text-xs text-white/90 line-clamp-2">{g.prompt}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a89dc9] mt-1">{g.model_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
