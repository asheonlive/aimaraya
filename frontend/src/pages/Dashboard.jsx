import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowUpRight, Zap } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) { nav("/auth"); return; }
    api.get("/generations").then(r => setHistory(r.data.generations));
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// WELCOME BACK</div>
      <h1 className="font-display text-5xl tracking-tighter mb-12">{user.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#27272A] border border-[#27272A] mb-16">
        <div className="bg-[#050505] p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-2">Credits remaining</div>
          <div className="font-display text-5xl text-[#E1FF01] mb-3">{user.credits}</div>
          <Link to="/pricing" data-testid="dash-topup" className="text-xs uppercase tracking-[0.2em] text-white hover:text-[#E1FF01] inline-flex items-center gap-1">
            Top up <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-[#050505] p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-2">Generations</div>
          <div className="font-display text-5xl mb-3">{history.length}</div>
          <div className="text-xs text-[#52525B]">All-time</div>
        </div>
        <div className="bg-[#050505] p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-2">Plan</div>
          <div className="font-display text-3xl mb-3">Pay-as-you-go</div>
          <Link to="/pricing" className="text-xs uppercase tracking-[0.2em] text-[#E1FF01]">Subscribe →</Link>
        </div>
      </div>

      <div className="flex items-end justify-between mb-8">
        <h2 className="font-display text-3xl tracking-tighter">Your gallery</h2>
        <Link to="/studio" data-testid="dash-newgen" className="bg-[#E1FF01] text-black px-6 py-3 text-sm font-medium hover:-translate-y-0.5 transition-transform inline-flex items-center gap-2">
          <Zap className="w-4 h-4" /> New generation
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="border border-dashed border-[#27272A] p-16 text-center">
          <p className="text-[#A1A1AA] mb-6">No creations yet. Time to make magic.</p>
          <Link to="/studio" className="text-[#E1FF01] underline">Open studio</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map(g => (
            <div key={g.id} className="border border-[#27272A] hover:border-[#E1FF01] hover-lift group">
              <div className="aspect-square overflow-hidden">
                <img src={resolveMedia(g.media_url)} alt={g.prompt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <div className="text-xs text-[#A1A1AA] truncate">{g.prompt}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#52525B] mt-1">{g.model_name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
