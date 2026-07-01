import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  { id: "trial", name: "Trial", price: "Free", tag: "Telegram code",
    perks: ["Short website access", "Test image and video models", "Activation key required"] },
  { id: "access", name: "AI MARAYA Access", price: "$10", tag: "Most popular", popular: true,
    perks: ["7 days of website access", "ArtCraft video and image engine", "Create or renew from Telegram"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();

  const buy = () => nav(user ? "/app" : "/auth");

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-center mb-16">
        <div className="pill mb-4 uppercase font-mono mx-auto inline-flex">Pricing</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-3">Simple Pricing, <span className="gradient-text">Powerful Results</span></h1>
        <p className="text-[#a89dc9] max-w-xl mx-auto">Create or renew access in the Telegram bot, then paste your activation key here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {PLANS.map(p => (
          <div key={p.id} className={`relative rounded-2xl p-8 hover-lift flex flex-col ${
            p.popular
              ? "gradient-purple text-white shadow-[0_20px_60px_-15px_rgba(168,85,247,0.5)]"
              : "card-purple"
          }`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">Most Popular</span>}
            <div className="text-sm mb-1 flex items-center gap-1">
              {p.popular && <Sparkles className="w-3.5 h-3.5" />}
              {p.tag}
            </div>
            <div className="text-2xl font-medium mb-4">{p.name}</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl tracking-tighter">{p.price}</span>
              <span className={`text-sm ${p.popular ? "opacity-70" : "text-[#a89dc9]"}`}>access</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {p.perks.map(x => (
                <li key={x} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> {x}
                </li>
              ))}
            </ul>
            <button
              data-testid={`buy-${p.id}`}
              onClick={buy}
              className={`w-full py-3 rounded-xl font-medium transition ${
                p.popular
                  ? "bg-black text-white hover:bg-black/80"
                  : "gradient-purple text-white hover:opacity-90"
              }`}
            >
              Enter Activation Key
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#6b6188] mt-12 font-mono">
        Payments and activation keys are handled by the AI MARAYA Telegram bot.
      </p>
    </div>
  );
}
