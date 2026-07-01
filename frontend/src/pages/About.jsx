import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Zap, Shield, Globe, Users, Target } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
      <div className="pill mb-6 uppercase font-mono inline-flex">About</div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-6">
        We're building the <span className="gradient-text">creative studio</span> of the AI era.
      </h1>
      <p className="text-lg text-[#a89dc9] leading-relaxed max-w-3xl mb-16">
        AI MARAYA is the all-in-one creative platform for the next generation of storytellers, marketers, filmmakers and designers. One subscription, every frontier model — from cinematic Sora 2 video to hyper-realistic FLUX imagery.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
        {[
          { i: Target, t: "Our Mission", d: "Democratize world-class visual production. Anyone with an idea deserves the tools that used to require a studio and a six-figure budget." },
          { i: Zap, t: "Our Approach", d: "Curate the best frontier models under one roof so creators never chase the next release. If it's cutting-edge, it lives inside AI MARAYA." },
          { i: Users, t: "Our Community", d: "100,000+ indie creators, agencies and content studios shipping content 10× faster with AI MARAYA." },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="card-purple p-6">
            <div className="w-10 h-10 rounded-xl gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-[#c084fc]" strokeWidth={1.75} />
            </div>
            <h3 className="font-medium mb-2">{t}</h3>
            <p className="text-sm text-[#a89dc9] leading-relaxed">{d}</p>
          </div>
        ))}
      </div>

      <div className="card-purple p-10 mb-20">
        <h2 className="font-display text-3xl tracking-tighter mb-6">By the numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "24+", v: "Frontier models" },
            { k: "100K+", v: "Creators" },
            { k: "12M+", v: "Assets generated" },
            { k: "60s", v: "Max video length" },
          ].map((s) => (
            <div key={s.v}>
              <div className="font-display text-4xl gradient-text mb-1">{s.k}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9]">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter mb-6">Ready to create with us?</h2>
        <Link to="/auth?mode=register" data-testid="about-cta" className="btn-primary inline-flex items-center gap-2">
          Get started for free <Sparkles className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
