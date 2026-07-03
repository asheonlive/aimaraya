import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Play, Sparkles, Image as ImageIcon, Video, User, Wand2,
  Scissors, Mic, ShoppingBag, ChevronDown, Star, Check, Zap, Clapperboard,
} from "lucide-react";

const HERO_MEDIA = {
  villa:   "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900",
  woman:   "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900",
  city:    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900",
  perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900",
  car:     "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900",
  neon:    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900",
  desert:  "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=900",
  chef:    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900",
};

const TOOLS = [
  { i: ImageIcon,   t: "Text → Image",        d: "26 frontier models" },
  { i: Video,       t: "Text → Video",         d: "Sora 2 · Veo 3.1 · Kling" },
  { i: Wand2,       t: "Image → Video",        d: "Animate any still" },
  { i: Clapperboard,t: "Storyboard Agent",     d: "Concept → shots → video" },
  { i: User,        t: "Character Studio",     d: "Consistent characters" },
  { i: Scissors,    t: "BG Remove & Replace",  d: "One-click cutouts" },
  { i: ShoppingBag, t: "Product Ads",          d: "E-commerce shots" },
  { i: Mic,         t: "Lip-Sync Video",       d: "Talking avatars" },
];

const MODEL_TICKER = [
  "SORA 2", "VEO 3.1", "FLUX 1.1 ULTRA", "KLING 3 OMNI", "IDEOGRAM V4",
  "GROK IMAGINE", "SEEDANCE PRO", "HAILUO", "GPT IMAGE 2", "LUMA RAY",
  "RECRAFT V4", "PIXVERSE", "HAPPYHORSE", "STABILITY ULTRA",
];

const TESTIMONIALS = [
  { name: "Layla Rahman", role: "Ad Creative · Dubai",   img: "https://i.pravatar.cc/80?img=47", q: "AI MARAYA replaced 3 production tools. Sora 2 alone paid for the annual plan in a week." },
  { name: "Marc Delgado", role: "Real-Estate Agency",    img: "https://i.pravatar.cc/80?img=13", q: "The Storyboard agent turns a listing description into a cinematic tour in under 4 minutes." },
  { name: "Priya S.",     role: "Indie Filmmaker",       img: "https://i.pravatar.cc/80?img=32", q: "Kling with Start→End frames is unreal. I story-boarded a short film in a single afternoon." },
  { name: "Kenji Ito",    role: "Studio Owner · Tokyo",  img: "https://i.pravatar.cc/80?img=52", q: "Every model in one place. My team stopped juggling subscriptions." },
  { name: "Aisha M.",     role: "Founder · Fashion",     img: "https://i.pravatar.cc/80?img=48", q: "Ideogram + FLUX Kontext on the same balance? Zero context switching. Ship faster." },
  { name: "David Chen",   role: "Head of Content",       img: "https://i.pravatar.cc/80?img=33", q: "The daily video allowance is simple and clear. Trust matters at this price point." },
];

const FAQ = [
  { q: "What is AI MARAYA?", a: "The creative studio that puts every frontier model — Sora 2, Veo 3.1, FLUX 1.1 Ultra, Kling, GPT Image 2, Ideogram — behind one subscription and one daily video allowance." },
  { q: "How does access work?", a: "Create a free account, buy a credit pack with Stripe, and start generating right away — no separate app or bot required." },
  { q: "Can I use outputs commercially?", a: "Paid access is intended for creator and commercial workflows, subject to the model providers' terms and acceptable-use rules." },
  { q: "Is there a free tier?", a: "New accounts start with a small free credit balance so you can try image and video models before buying a pack." },
  { q: "Which video models are live?", a: "Sora 2, Sora 2 Pro, Veo 3.1 Fast, Veo 2, Kling 3 Omni, Kling 2.5 Turbo, Kling Start→End, Kling Camera Control, Seedance Pro/Fast, Grok Imagine, HappyHorse, Luma Ray Flash 2, PixVerse, MiniMax Hailuo — plus more shipping monthly." },
];

const PLANS = [
  { id: "starter", name: "Starter", monthly: 12, yearly: 12, credits: "3,000 credits", perks: ["All image & video models", "No expiry", "Sign up in seconds"] },
  { id: "pro", name: "Pro", monthly: 29, yearly: 29, credits: "10,000 credits", perks: ["All image & video models", "Priority queue", "No expiry"], popular: true },
];

const SEEDANCE_SHOWCASE = [
  { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",  poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800", title: "Neon Metropolis",     prompt: "Cyberpunk cityscape at dusk, rain reflections, cinematic drone shot" },
  { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",poster: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800", title: "Luxury Drive",        prompt: "Sleek sports car cruising coastal highway, golden hour, anamorphic" },
  { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", poster: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800", title: "Desert Odyssey",     prompt: "Traveler crossing red dunes, wind, cinematic scale" },
  { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",     poster: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800", title: "Perfume Reveal",     prompt: "Slow-mo perfume bottle rotation, macro lens, studio lighting" },
  { src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",poster:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", title: "Michelin Kitchen",   prompt: "Chef finishing a plate, steam swirls, cinematic close-up" },
];

// ------------------------- Hero showcase columns -----------------------
// Real AI-generated visuals hotlinked from partner CDN.
const _OA = "https://cdn.openart.ai/assets/internal/uploads/";
const SHOWCASE_COL_1 = [
  { img: `${_OA}image_CsJ_IqM2_600x800_1781682208175.webp`, label: "Seedance 2.0 · Cinematic",  tag: "VIDEO" },
  { img: `${_OA}image_A8jQyhZR_600x800_1781788985091.webp`, label: "Nano Banana Pro",           tag: "IMAGE" },
  { img: `${_OA}image_ABYKHNYZ_600x800_1781682207796.webp`, label: "FLUX 1.1 Ultra",            tag: "IMAGE" },
  { img: `${_OA}image_HZ6dgVCt_600x800_1781682208120.webp`, label: "Lip-Sync · Kling",          tag: "VIDEO" },
  { img: `${_OA}image_i0lJBBxR_512x512_1774499262487.webp`, label: "Character · GPT Image",     tag: "IMAGE" },
];
const SHOWCASE_COL_2 = [
  { img: `${_OA}image_g_OTQ1Fw_600x800_1781682207947.webp`, label: "Kling 3.0 Omni",            tag: "VIDEO" },
  { img: `${_OA}image_iLDTHFIk_720x402_1782316634275.webp`, label: "Gemini Omni",               tag: "IMAGE" },
  { img: `${_OA}image_2olSwhi1_600x800_1781682207920.webp`, label: "Nano Banana · Portrait",    tag: "IMAGE" },
  { img: `${_OA}image_8MO2Ayl8_1920x1080_1781498671823.webp`, label: "Sora 2 · Cinematic",      tag: "VIDEO" },
  { img: `${_OA}image_iUYIDfuf_600x800_1781682207800.webp`, label: "Ideogram V4",               tag: "IMAGE" },
];
const SHOWCASE_COL_3 = [
  { img: `${_OA}image_vkP7sut3_600x800_1781682207959.webp`, label: "Motion Sync",               tag: "VIDEO" },
  { img: `${_OA}image_6FXfp8W__600x800_1781682207739.webp`, label: "Recraft V4 · Design",       tag: "IMAGE" },
  { img: `${_OA}image_GfcFA9_m_1008x1008_1771461069379.webp`, label: "Stability Ultra",         tag: "IMAGE" },
  { img: `${_OA}image_Tuv4xeLU_1024x576_1782833157395.webp`, label: "Veo 3.1 · Fast",           tag: "VIDEO" },
  { img: `${_OA}image_joPwIneD_512x512_1774499266254.webp`, label: "Grok Imagine",              tag: "IMAGE" },
];

// Latest / spotlight models (real hosted assets)
const LATEST_MODELS = [
  { name: "Seedance 2.0",      badge: "NEW",  desc: "Cinematic daily video generation", img: "https://cdn.openart.ai/assets/internal/uploads/image_CsJ_IqM2_600x800_1781682208175.webp" },
  { name: "Gemini Omni",       badge: "BETA", desc: "Multi-modal reasoning + image",   img: "https://cdn.openart.ai/assets/internal/uploads/image_iLDTHFIk_720x402_1782316634275.webp" },
  { name: "Nano Banana Pro",   badge: "NEW",  desc: "High-detail image editing",       img: "https://cdn.openart.ai/assets/internal/uploads/image_2olSwhi1_600x800_1781682207920.webp" },
  { name: "Kling 3.0 Omni",    badge: "LIVE", desc: "Camera-controlled cinematic",     img: "https://cdn.openart.ai/assets/internal/uploads/image_g_OTQ1Fw_600x800_1781682207947.webp" },
  { name: "Motion Sync",       badge: "NEW",  desc: "Sync any motion to your subject", img: "https://cdn.openart.ai/assets/internal/uploads/image_vkP7sut3_600x800_1781682207959.webp" },
  { name: "Lip-Sync Pro",      badge: "LIVE", desc: "Talking avatars, natural mouth",  img: "https://cdn.openart.ai/assets/internal/uploads/image_HZ6dgVCt_600x800_1781682208120.webp" },
];

// ------------------------- Sub-components ------------------------------

const useSpotlight = () => {
  const ref = useRef(null);
  const onMouseMove = (e) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };
  return { ref, onMouseMove };
};

function AnimatedHeadline() {
  const words = ["Stunning", "Cinematic", "Photorealistic", "Impossible", "Beautiful"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % words.length), 2200); return () => clearInterval(t); }, []);
  return (
    <span className="inline-block relative align-baseline min-w-[7ch]">
      {words.map((w, idx) => (
        <span key={w} className={`absolute inset-0 shimmer-text transition-all duration-500 ${idx === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {w}
        </span>
      ))}
      <span className="opacity-0 shimmer-text">{words[i]}</span>
    </span>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);
  const [billing, setBilling] = useState("monthly");
  const spot = useSpotlight();

  return (
    <div className="relative">
      {/* ============================ HERO ============================ */}
      <section
        ref={spot.ref}
        onMouseMove={spot.onMouseMove}
        className="relative overflow-hidden spotlight"
        style={{ "--x": "50%", "--y": "50%" }}
      >
        {/* Animated background */}
        <div className="orb aurora w-[800px] h-[800px] -top-60 -right-40" />
        <div className="orb animate-float-medium w-[500px] h-[500px] top-40 -left-40" style={{ opacity: 0.5 }} />
        <div className="absolute inset-0 bg-grid-animated opacity-40" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-32">
          {/* Announcement bar */}
          <div className="relative flex justify-center mb-10 fade-in">
            <Link to="/app/storyboard" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#a855f7]/40 bg-[#a855f7]/10 text-[#c084fc] text-xs backdrop-blur-md group hover:bg-[#a855f7]/20 transition-all">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a855f7] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#a855f7]" />
              </span>
              <span className="font-mono tracking-wider uppercase">New</span>
              <span className="text-white/80">Storyboard Agent · GPT Image 2 + auto-animate</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Headline */}
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tighter leading-[0.95] mb-8 fade-in">
              Generate <AnimatedHeadline /><br/>
              <span className="text-outline">AI content</span> in seconds
            </h1>
            <p className="text-lg text-[#a89dc9] max-w-2xl mx-auto leading-relaxed mb-10 fade-in" style={{ animationDelay: "0.15s" }}>
              One studio. Every frontier model. Cinematic videos, hyper-realistic images, characters, product ads and storyboards — all from one account.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-16 fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/auth?mode=register" data-testid="hero-start" className="btn-primary inline-flex items-center gap-2 relative pulse-ring">
                Start Creating <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/models" data-testid="hero-models" className="btn-ghost inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> See all 30 models
              </Link>
            </div>
          </div>

          {/* Premium 3-column showcase marquee */}
          <div className="relative mx-auto max-w-6xl mt-4 fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="grid grid-cols-3 gap-4 md:gap-5 h-[540px] md:h-[620px] overflow-hidden mask-fade-y">
              <ShowcaseColumn direction="up"   items={SHOWCASE_COL_1} />
              <ShowcaseColumn direction="down" items={SHOWCASE_COL_2} />
              <ShowcaseColumn direction="up"   items={SHOWCASE_COL_3} />
            </div>
            {/* Center CTA overlay chip */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
              <div className="pointer-events-auto pill bg-black/70 backdrop-blur-md border-white/20 !py-2 !px-4 font-mono text-[11px] uppercase tracking-widest">
                <span className="text-[#c084fc]">30 models</span>
                <span className="mx-2 text-white/40">·</span>
                <span className="text-emerald-400">Instant access</span>
                <span className="mx-2 text-white/40">·</span>
                <span className="text-white/80">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MODEL TICKER ============================ */}
      <section className="border-y border-[#2a2340] py-6 overflow-hidden bg-[#0d0919]">
        <div className="flex overflow-hidden">
          <div className="marquee-slow flex gap-16 whitespace-nowrap">
            {[...MODEL_TICKER, ...MODEL_TICKER].map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-[#a89dc9]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                <span className="font-display text-2xl tracking-tighter hover:text-[#c084fc] transition-colors cursor-default">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ SEEDANCE 2.0 SHOWCASE ============================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24" data-testid="seedance-showcase">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <div className="pill mb-4 uppercase font-mono inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              Now Live · Seedance 2.0
            </div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-3 leading-[1.05]">
              Cinematic video at <span className="gradient-text">a fraction</span> of the price.
            </h2>
            <p className="text-[#a89dc9] max-w-xl text-sm md:text-base">
              ByteDance <span className="text-white font-semibold">Seedance 2.0</span> delivers premium motion through the AI MARAYA generation engine.
              Same fidelity as models charging 3-5x. Real footage generated by our users below.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="px-4 py-3 rounded-xl border border-emerald-400/30 bg-emerald-400/5">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Seedance Fast</div>
              <div className="font-mono text-emerald-300 text-lg">Fast · 5s+</div>
            </div>
            <div className="px-4 py-3 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/5">
              <div className="text-[10px] uppercase tracking-wider text-[#c084fc]">Seedance Pro</div>
              <div className="font-mono text-[#c084fc] text-lg">Pro · 720p</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEEDANCE_SHOWCASE.map((v, idx) => (
            <div
              key={idx}
              data-testid={`seedance-card-${idx}`}
              className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#a855f7]/50 transition-all cursor-pointer bg-[#0d0919]"
              onMouseEnter={(e) => { const vid = e.currentTarget.querySelector("video"); if (vid) vid.play().catch(() => {}); }}
              onMouseLeave={(e) => { const vid = e.currentTarget.querySelector("video"); if (vid) { vid.pause(); vid.currentTime = 0; } }}
            >
              <video
                src={v.src}
                poster={v.poster}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="pill !py-1 !px-2 text-[10px] font-mono bg-black/60 border-emerald-400/40 text-emerald-300">SEEDANCE 2.0</span>
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="font-display text-lg tracking-tight text-white mb-1">{v.title}</div>
                <div className="text-[11px] text-white/70 line-clamp-2 leading-relaxed font-mono">{v.prompt}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/app/create-video"
            data-testid="seedance-cta"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Video className="w-4 h-4" /> Try Seedance 2.0
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="text-xs text-[#a89dc9] mt-3 font-mono">
            Sign up free and start generating in seconds
          </div>
        </div>
      </section>

      {/* ============================ LATEST MODELS SPOTLIGHT ============================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20" data-testid="latest-models">
        <div className="mb-8">
          <div className="pill mb-4 uppercase font-mono inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] mr-2 animate-pulse" />
            Latest Models
          </div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter leading-[1.05]">
            Shipped this week. <span className="gradient-text">Try them free.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LATEST_MODELS.map((m) => (
            <div
              key={m.name}
              data-testid={`latest-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#a855f7]/60 group cursor-pointer transition-all"
            >
              <img
                src={m.img}
                alt={m.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #1a1530, #0d0919)"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="absolute top-2 right-2">
                <span className={`pill !py-0.5 !px-1.5 text-[9px] font-mono ${m.badge === "NEW" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : m.badge === "BETA" ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-[#a855f7]/40 bg-[#a855f7]/10 text-[#c084fc]"}`}>
                  {m.badge}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="font-display text-sm tracking-tight text-white mb-0.5">{m.name}</div>
                <div className="text-[10px] text-white/70 line-clamp-2 leading-tight font-mono">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ TOOLS BENTO ============================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="text-center mb-14">
          <div className="pill mb-4 uppercase font-mono inline-flex">The Toolkit</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-4">
            Every AI creative tool. <span className="gradient-text">In one place.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
          {TOOLS.map(({ i: Icon, t, d }) => (
            <div key={t} className="card-hover-glow group tool-card cursor-pointer relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-[#c084fc]" strokeWidth={1.75} />
              </div>
              <h3 className="font-medium text-sm mb-1">{t}</h3>
              <p className="text-xs text-[#a89dc9] leading-relaxed">{d}</p>
              <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/30 group-hover:text-[#c084fc] group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* ============================ FEATURE / STORYBOARD ============================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="pill mb-4 uppercase font-mono inline-flex">New · Agent</div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-6 leading-[1.05]">
              From concept to <span className="gradient-text">finished video</span> —<br/>
              in one click.
            </h2>
            <p className="text-[#a89dc9] text-lg mb-8 leading-relaxed">
              Type a story. The Storyboard Agent breaks it into shots, draws each panel with GPT Image 2, then animates the whole sequence with Sora, Kling or Veo — automatically.
            </p>
            <ul className="space-y-3 mb-8">
              {["Multi-shot scene breakdown", "GPT Image 2 panels", "One-click animate all", "Consistent style throughout"].map(x => (
                <li key={x} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full gradient-purple flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div>
                  {x}
                </li>
              ))}
            </ul>
            <Link to="/app/storyboard" className="btn-primary inline-flex items-center gap-2">
              Try Storyboard Agent <Clapperboard className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative card-3d">
            <div className="relative rounded-3xl overflow-hidden card-purple p-6 aspect-square">
              <div className="grid grid-cols-2 gap-3 h-full">
                {[HERO_MEDIA.city, HERO_MEDIA.villa, HERO_MEDIA.car, HERO_MEDIA.desert].map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-[#a855f7]/20">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/80 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono uppercase tracking-wider text-white/80">Shot {i+1}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-6 -right-6 gradient-purple rounded-2xl px-4 py-3 shadow-[0_20px_40px_-10px_rgba(168,85,247,0.6)]">
                <div className="text-[10px] uppercase tracking-wider text-white/70 mb-0.5">Agent status</div>
                <div className="text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> 4 of 6 shots animated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TESTIMONIALS ============================ */}
      <section className="border-y border-[#2a2340] py-20 overflow-hidden bg-[#0d0919]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-12">
          <div className="text-center">
            <div className="pill mb-4 uppercase font-mono inline-flex">Loved by creators</div>
            <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Trusted by 100,000+ makers</h2>
          </div>
        </div>
        <div className="overflow-hidden py-4">
          <div className="marquee-slow flex gap-4 whitespace-nowrap">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
        <div className="overflow-hidden py-4 mt-4">
          <div className="marquee-rev flex gap-4 whitespace-nowrap">
            {[...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()].map((t, i) => <TestimonialCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ============================ PRICING ============================ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="text-center mb-10">
          <div className="pill mb-4 uppercase font-mono inline-flex">Pricing</div>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-6">Simple pricing. <span className="gradient-text">Powerful results.</span></h2>
          <div className="inline-flex bg-[#1a1530]/60 border border-[#2a2340] rounded-full p-1">
            {["monthly","yearly"].map(b => (
              <button key={b} onClick={() => setBilling(b)} className={`px-5 py-1.5 rounded-full text-xs uppercase tracking-wider transition ${billing === b ? "gradient-purple text-white" : "text-white/60"}`}>
                {b}{b === "yearly" && <span className="ml-2 text-[9px] bg-black/40 rounded px-1.5 py-0.5">Save 25%</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PLANS.map(p => {
            const price = billing === "yearly" ? Math.round(p.yearly / 12) : p.monthly;
            return (
              <div key={p.id} className={`relative rounded-2xl p-7 hover-lift flex flex-col ${p.popular ? "gradient-purple text-white" : "card-purple"}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">Most Popular</span>}
                <div className="text-sm font-medium mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display text-5xl tracking-tighter">{p.monthly === 0 ? "Trial" : "$10"}</span>
                  <span className="text-xs opacity-70">access</span>
                </div>
                <div className={`text-xs mb-6 ${p.popular ? "text-white/80" : "text-[#a89dc9]"}`}>{p.credits}</div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.perks.map(x => (
                    <li key={x} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {x}
                    </li>
                  ))}
                </ul>
                <Link to="/pricing" data-testid={`land-plan-${p.id}`} className={`block text-center text-sm py-2.5 rounded-lg font-medium ${p.popular ? "bg-black text-white hover:bg-black/80" : "bg-[#a855f7]/10 border border-[#a855f7]/30 hover:bg-[#a855f7]/20"}`}>
                  Enter Key
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
        <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-10 text-center">Common questions.</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="card-purple">
              <button data-testid={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40" : "max-h-0"}`}>
                <div className="px-6 pb-5 text-sm text-[#a89dc9] leading-relaxed">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-24 text-center relative">
        <div className="orb w-[500px] h-[500px] top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 opacity-60" />
        <div className="relative">
          <h2 className="font-display text-5xl md:text-7xl tracking-tighter mb-6 leading-[0.95]">
            Ready to create<br/>
            <span className="gradient-text">something remarkable?</span>
          </h2>
          <p className="text-[#a89dc9] max-w-lg mx-auto mb-10">Create a free account and start generating in seconds.</p>
          <Link to="/auth?mode=register" data-testid="cta-final" className="btn-primary inline-flex items-center gap-2 text-base pulse-ring relative">
            Start creating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FloatingCard({ img, label, className = "", small = false, isVideo = false }) {
  return (
    <div className={`absolute rounded-2xl overflow-hidden border border-[#a855f7]/30 shadow-[0_20px_50px_-15px_rgba(168,85,247,0.5)] card-hover-glow ${className}`}>
      <img src={img} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07050f]/80 via-transparent to-transparent" />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>
      )}
      {!small && (
        <div className="absolute bottom-3 left-3 pill !py-0.5 !px-2 text-[10px]">{label}</div>
      )}
    </div>
  );
}

function ShowcaseColumn({ items, direction = "up" }) {
  const loop = [...items, ...items];
  const cls = direction === "up" ? "hero-scroll-up" : "hero-scroll-down";
  return (
    <div className="relative overflow-hidden">
      <div className={`flex flex-col gap-4 md:gap-5 ${cls}`}>
        {loop.map((it, i) => (
          <div key={i} className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(168,85,247,0.35)] group">
            <img src={it.img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <div className="absolute top-2 right-2">
              <span className={`pill !py-0.5 !px-1.5 text-[9px] font-mono ${it.tag === "VIDEO" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-[#a855f7]/40 bg-[#a855f7]/10 text-[#c084fc]"}`}>
                {it.tag}
              </span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white/90 truncate">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, img, q }) {
  return (
    <div className="w-[380px] shrink-0 card-purple p-6 whitespace-normal">
      <div className="flex items-center gap-3 mb-4">
        <img src={img} className="w-10 h-10 rounded-full object-cover border border-[#a855f7]/30" alt="" />
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-[11px] text-[#a89dc9]">{role}</div>
        </div>
        <div className="ml-auto flex gap-0.5">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-[#c084fc] text-[#c084fc]" />)}
        </div>
      </div>
      <p className="text-sm text-white/85 leading-relaxed">"{q}"</p>
    </div>
  );
}
