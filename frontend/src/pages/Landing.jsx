import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Zap, Layers, Cpu, ShieldCheck, Infinity as Inf, Play } from "lucide-react";
import { api } from "@/lib/api";

const FEATURE_IMAGES = {
  cinematic: "https://images.pexels.com/photos/34742154/pexels-photo-34742154.jpeg",
  surreal: "https://images.pexels.com/photos/28617020/pexels-photo-28617020.jpeg",
  anime: "https://images.pexels.com/photos/13825479/pexels-photo-13825479.jpeg",
  product: "https://images.unsplash.com/photo-1662350688742-0d52a8e71fea",
  hero: "https://images.pexels.com/photos/12784315/pexels-photo-12784315.jpeg",
};

const MARQUEE = ["NANO BANANA", "SORA 2", "FLUX 1.1 ULTRA", "VEO 3.1", "KLING 2.5", "GROK IMAGINE", "IDEOGRAM V4", "SEEDANCE", "GPT IMAGE 1", "RECRAFT V4", "HAILUO"];

export default function Landing() {
  const [models, setModels] = useState([]);
  useEffect(() => { api.get("/models").then(r => setModels(r.data.models)); }, []);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#27272A]">
        <div className="orb w-[600px] h-[600px] -top-40 -right-40" />
        <div className="orb w-[400px] h-[400px] bottom-0 -left-20" style={{ opacity: 0.4 }} />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32">
          <div className="flex items-center gap-3 mb-8 fade-in">
            <span className="px-3 py-1 border border-[#E1FF01]/40 text-[#E1FF01] text-xs font-mono uppercase tracking-[0.2em]">Now serving 26 frontier models</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-medium tracking-tighter leading-[0.9] max-w-5xl">
            Every <span className="text-[#E1FF01]">famous</span> AI<br/>
            model. One studio.
          </h1>
          <p className="mt-8 text-lg text-[#A1A1AA] max-w-2xl leading-relaxed">
            Maraya AI is the professional creative platform that brings together Sora 2, Veo 3.1, FLUX 1.1 Ultra, Kling, Ideogram, Nano Banana, Grok Imagine, GPT Image 1 and 20+ more — under one subscription.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/auth?mode=register" data-testid="hero-getstarted" className="bg-[#E1FF01] text-black font-medium px-8 py-4 hover:-translate-y-1 transition-transform shadow-[0_0_30px_rgba(225,255,1,0.25)] inline-flex items-center gap-2">
              Start generating <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <Link to="/models" data-testid="hero-browse" className="border border-[#27272A] text-white px-8 py-4 hover:bg-white/5 transition-colors inline-flex items-center gap-2">
              <Play className="w-4 h-4" /> Browse the lineup
            </Link>
          </div>
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#27272A] border border-[#27272A]">
            {[
              { k: "26", v: "Frontier models" },
              { k: "4K", v: "Max resolution" },
              { k: "120s", v: "Video clips" },
              { k: "∞", v: "Style possibilities" },
            ].map((s) => (
              <div key={s.v} className="bg-[#050505] p-6">
                <div className="font-display text-4xl font-medium text-[#E1FF01]">{s.k}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mt-2">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-b border-[#27272A] py-8 overflow-hidden">
        <div className="marquee whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="font-display text-4xl tracking-tighter text-[#27272A] hover:text-[#E1FF01] transition-colors cursor-default">
              {m} ✦
            </span>
          ))}
        </div>
      </section>

      {/* MODEL BENTO */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// THE LINEUP</div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter max-w-2xl">A model for every aesthetic.</h2>
          </div>
          <Link to="/models" data-testid="landing-allmodels" className="text-sm border-b border-[#E1FF01] text-[#E1FF01] pb-1 hover:gap-3 inline-flex items-center gap-2 transition-all">
            All 26 models <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <BentoCard className="md:col-span-7 md:row-span-2" img={FEATURE_IMAGES.cinematic} title="FLUX 1.1 Ultra" tag="Hyper-Realistic" credits={4} type="Image" />
          <BentoCard className="md:col-span-5" img={FEATURE_IMAGES.product} title="Nano Banana" tag="Artistic" credits={1} type="Image" highlight />
          <BentoCard className="md:col-span-5" img={FEATURE_IMAGES.anime} title="Ideogram V4" tag="Typography" credits={3} type="Image" />
          <BentoCard className="md:col-span-6" img={FEATURE_IMAGES.surreal} title="Sora 2" tag="Cinematic Video" credits={12} type="Video" />
          <BentoCard className="md:col-span-6" img={FEATURE_IMAGES.hero} title="Veo 3.1 Fast" tag="High Fidelity" credits={11} type="Video" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// WHY MARAYA</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter max-w-3xl mb-16">Built for professionals. Priced for creators.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#27272A] border border-[#27272A]">
            {[
              { i: Zap, t: "Instant generation", d: "Tap into the fastest frontier endpoints, fronted by our own GPU pool." },
              { i: Layers, t: "Multi-model workflow", d: "Switch between Nano Banana, Midjourney, FLUX without leaving the studio." },
              { i: Cpu, t: "Smart credits", d: "One balance, transparent costs. Refunds on failed generations." },
              { i: ShieldCheck, t: "Private by default", d: "Your prompts and assets stay yours. Granular visibility controls." },
              { i: Inf, t: "Unlimited styles", d: "Reference images, character consistency, aspect ratios, motion control." },
              { i: ArrowUpRight, t: "Built for scale", d: "API access (coming soon) for teams, agencies and ad creatives." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="bg-[#050505] p-8 hover-lift">
                <Icon className="w-6 h-6 text-[#E1FF01] mb-4" strokeWidth={1.5} />
                <h3 className="font-display text-xl tracking-tight mb-2">{t}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center">
        <h2 className="font-display text-5xl md:text-7xl tracking-tighter mb-6">
          Generate <span className="text-[#E1FF01]">beyond</span> limits.
        </h2>
        <p className="text-[#A1A1AA] max-w-xl mx-auto mb-10">20 free credits when you sign up. No credit card required.</p>
        <Link to="/auth?mode=register" data-testid="cta-bottom" className="inline-flex items-center gap-2 bg-[#E1FF01] text-black px-10 py-5 text-lg font-medium hover:-translate-y-1 transition-transform">
          Create your first piece <ArrowUpRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

function BentoCard({ className = "", img, title, tag, credits, type, highlight }) {
  return (
    <div className={`relative group overflow-hidden border border-[#27272A] hover:border-[#E1FF01] transition-colors min-h-[280px] ${className} ${highlight ? "glow-accent" : ""}`}>
      <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      <div className="relative h-full flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#E1FF01]">{type} · {credits} CR</span>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-2">{tag}</div>
          <h3 className="font-display text-3xl tracking-tighter">{title}</h3>
        </div>
      </div>
    </div>
  );
}
