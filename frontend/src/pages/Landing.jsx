import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Play, Sparkles, Image as ImageIcon, Video, User, Wand2,
  Scissors, Mic, ShoppingBag, ChevronDown, Star, Check, Zap,
} from "lucide-react";
import { api } from "@/lib/api";

const HERO_IMGS = {
  villa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900",
  woman: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900",
  city: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900",
  perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=900",
};

const TOOLS = [
  { i: ImageIcon, t: "Text to Image", d: "Create stunning artwork" },
  { i: Video, t: "Image to Video", d: "Animate your images" },
  { i: Wand2, t: "Text to Video", d: "Generate videos from text" },
  { i: User, t: "Character Creator", d: "Consistent AI characters" },
  { i: Zap, t: "Video Upscale", d: "Increase quality & resolution" },
  { i: Scissors, t: "Background Remover", d: "Remove background instantly" },
  { i: Mic, t: "Lip Sync", d: "Make characters talk" },
  { i: ShoppingBag, t: "Product Ads", d: "Create stunning product shots" },
];

const COMMUNITY = [
  { img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500", user: "ai_visionary", likes: "1.2K" },
  { img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500", user: "speed_creative", likes: "1.1K" },
  { img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500", user: "dreamweaver", likes: "1.5K" },
  { img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500", user: "creative_soul", likes: "964" },
  { img: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500", user: "future_frame", likes: "1.1K" },
];

const FAQ = [
  { q: "What is ArtCraft AI?", a: "ArtCraft AI is an all-in-one AI creative studio that lets you generate images and videos from text or images using 26+ advanced AI models — Sora 2, Veo 3.1, FLUX 1.1 Ultra, Kling, Nano Banana and more — under one subscription." },
  { q: "How does the credit system work?", a: "Every plan comes with a monthly credit balance. Simple images cost 1–4 credits; cinematic videos cost 6–18 depending on model and length. Unused credits roll over up to 2× your monthly quota." },
  { q: "Can I use the images and videos commercially?", a: "Yes — Starter and above include a full commercial-use license. Ultra unlocks priority generation and the highest-quality models." },
  { q: "Which payment methods do you support?", a: "Credit/debit cards, Apple Pay and Google Pay via Stripe. Team invoicing available on Ultra." },
  { q: "Is there a free trial?", a: "Yes — every new account gets 100 credits free, no card required. Upgrade anytime." },
];

const PLANS = [
  { id: "free", name: "Free", price: 0, credits: "100 credits/month", perks: ["Up to 20 images", "Up to 5 sec video", "Standard models"] },
  { id: "starter", name: "Starter", price: 12, credits: "3,000 credits/month", perks: ["Up to 15 sec video", "Access to fast models", "Commercial use"] },
  { id: "pro", name: "Pro", price: 29, credits: "10,000 credits/month", perks: ["Up to 30 sec video", "Access to fast models", "Priority generation", "Commercial use"], popular: true },
  { id: "ultra", name: "Ultra", price: 59, credits: "30,000 credits/month", perks: ["Up to 60 sec video", "Highest quality", "Priority generation", "Commercial use"] },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="orb w-[700px] h-[700px] -top-40 -right-20" />
        <div className="orb w-[500px] h-[500px] top-40 -left-40" style={{ opacity: 0.6 }} />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="fade-in">
            <div className="pill mb-8 uppercase font-mono">
              <Star className="w-3 h-3 fill-current" /> #1 AI Creative Studio
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[0.95] mb-6">
              Create <span className="gradient-text">Stunning</span><br/>
              AI Images & Videos<br/>
              in Seconds
            </h1>
            <p className="text-lg text-[#a89dc9] max-w-lg leading-relaxed mb-10">
              Generate cinematic videos, realistic images, characters, product ads, real estate visuals and social media content with 26+ advanced AI models.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/auth?mode=register" data-testid="hero-start" className="btn-primary inline-flex items-center gap-2">
                Start Creating <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/app/templates" data-testid="hero-templates" className="btn-ghost inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> Explore Templates
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#07050f] gradient-purple flex items-center justify-center text-xs font-semibold">
                    {String.fromCharCode(64+i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#a855f7] text-[#a855f7]" />)}
                </div>
                <div className="text-xs text-[#a89dc9]">Trusted by 100,000+ creators</div>
              </div>
            </div>
          </div>

          {/* HERO PREVIEW GRID */}
          <div className="relative grid grid-cols-2 gap-3 h-[520px]">
            <div className="relative rounded-2xl overflow-hidden border border-[#a855f7]/25">
              <img src={HERO_IMGS.villa} className="w-full h-full object-cover" alt="" />
              <span className="absolute top-3 left-3 pill text-[10px] !py-1 !px-2">Real Estate</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[#a855f7]/25">
              <img src={HERO_IMGS.woman} className="w-full h-full object-cover" alt="" />
              <span className="absolute top-3 right-3 pill text-[10px] !py-1 !px-2">AI Image</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[#a855f7]/25 col-span-1">
              <img src={HERO_IMGS.city} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-black fill-black ml-1" />
                </div>
              </div>
              <span className="absolute top-3 left-3 pill text-[10px] !py-1 !px-2">AI Video</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-[#a855f7]/25">
              <img src={HERO_IMGS.perfume} className="w-full h-full object-cover" alt="" />
              <span className="absolute bottom-3 right-3 pill text-[10px] !py-1 !px-2">Product Ads</span>
            </div>
          </div>
        </div>
      </section>

      {/* TOOL GRID */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <h2 className="text-center font-display text-3xl md:text-4xl tracking-tighter mb-12">Powerful Tools for Every Creator</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          {TOOLS.map(({ i: Icon, t, d }) => (
            <div key={t} className="tool-card hover-lift" data-testid={`tool-${t.toLowerCase().replace(/\s+/g,'-')}`}>
              <div className="w-10 h-10 rounded-xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#c084fc]" strokeWidth={1.75} />
              </div>
              <h3 className="font-medium text-sm mb-1">{t}</h3>
              <p className="text-xs text-[#a89dc9] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2">// Community</div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tighter">Community Showcase</h2>
          </div>
          <Link to="/explore" className="text-sm text-[#c084fc] hover:text-white flex items-center gap-2">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {COMMUNITY.map((c, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#2a2340] hover-lift group">
              <img src={c.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07050f] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="text-white/90">@{c.user}</span>
                <span className="pill !py-0.5 !px-2 text-[10px]">♡ {c.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-2">// Pricing</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tighter mb-3">Simple Pricing, Powerful Results</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PLANS.map(p => (
            <div key={p.id} className={`relative rounded-2xl p-6 hover-lift ${p.popular ? "gradient-purple text-white" : "card-purple"}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">Most Popular</span>}
              <div className="text-sm font-medium mb-1">{p.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-4xl">${p.price}</span>
                <span className="text-xs opacity-70">/month</span>
              </div>
              <div className={`text-xs mb-4 ${p.popular ? "text-white/80" : "text-[#a89dc9]"}`}>{p.credits}</div>
              <ul className="space-y-2 mb-6">
                {p.perks.map(x => (
                  <li key={x} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" data-testid={`land-plan-${p.id}`} className={`block text-center text-sm py-2 rounded-lg font-medium transition ${p.popular ? "bg-black text-white hover:bg-black/80" : "bg-[#a855f7]/10 border border-[#a855f7]/30 hover:bg-[#a855f7]/20"}`}>
                {p.price === 0 ? "Get Started" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="card-purple">
              <button data-testid={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-6 pb-5 text-sm text-[#a89dc9] leading-relaxed -mt-1">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-20 text-center">
        <h2 className="font-display text-4xl md:text-6xl tracking-tighter mb-6">
          Ready to <span className="gradient-text">create magic?</span>
        </h2>
        <p className="text-[#a89dc9] mb-10">100 free credits when you sign up. No credit card required.</p>
        <Link to="/auth?mode=register" data-testid="cta-final" className="btn-primary inline-flex items-center gap-2">
          Start Creating Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
