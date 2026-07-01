import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import { Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton, PageFade } from "@/components/motion";

export default function Assets() {
  const [gens, setGens] = useState(null);
  const load = () => api.get("/generations").then(r => setGens(r.data.generations || []));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try { await api.delete(`/generations/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };
  const publish = async (id) => {
    try { await api.post(`/generations/${id}/publish`); toast.success("Published to Explore"); }
    catch { toast.error("Publish failed"); }
  };

  return (
    <PageFade>
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1">// Your library</div>
          <h1 className="font-display text-3xl tracking-tighter">My Generations</h1>
        </div>
        <Link to="/app/create-image" className="btn-primary text-sm inline-flex items-center gap-2">
          <Zap className="w-4 h-4" /> New Generation
        </Link>
      </div>
      {gens === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : gens.length === 0 ? (
        <div className="card-purple py-20 text-center">
          <p className="text-[#a89dc9] mb-4">No generations yet. Time to create something.</p>
          <Link to="/app/create-image" className="text-[#c084fc] underline">Open Studio</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gens.map(g => (
            <div key={g.id} className="rounded-2xl overflow-hidden border border-[#2a2340] hover-lift group bg-[#0d0919] card-tilt">
              <div className="aspect-square overflow-hidden relative">
                {g.type === "video"
                  ? <video src={resolveMedia(g.media_url)} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                  : <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 flex items-end justify-end p-2 gap-1">
                  <button onClick={() => publish(g.id)} data-testid={`assets-publish-${g.id}`} className="w-8 h-8 rounded-full bg-[#a855f7] hover:bg-[#8b5cf6] flex items-center justify-center text-white text-xs" title="Publish to Explore">✦</button>
                  <button onClick={() => remove(g.id)} data-testid={`assets-delete-${g.id}`} className="w-8 h-8 rounded-full bg-[#ff3b7a] hover:bg-red-600 flex items-center justify-center" title="Delete"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
                </div>
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
    </PageFade>
  );
}
