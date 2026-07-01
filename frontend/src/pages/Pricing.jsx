import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  { id: "free", name: "Free", price: 0, credits: 100, tag: "Get started",
    perks: ["100 credits/month", "Up to 20 images", "Up to 5 sec video", "Standard models"] },
  { id: "starter", name: "Starter", price: 12, credits: 3000, tag: "For hobbyists",
    perks: ["3,000 credits/month", "Up to 15 sec video", "Access to fast models", "Commercial use"] },
  { id: "pro", name: "Pro", price: 29, credits: 10000, tag: "Most popular", popular: true,
    perks: ["10,000 credits/month", "Up to 30 sec video", "Access to fast models", "Priority generation", "Commercial use"] },
  { id: "ultra", name: "Ultra", price: 59, credits: 30000, tag: "For agencies",
    perks: ["30,000 credits/month", "Up to 60 sec video", "Highest quality", "Priority generation", "Commercial use"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loadingId, setLoadingId] = useState(null);

  const buy = async (id) => {
    if (id === "free") { nav(user ? "/app" : "/auth?mode=register"); return; }
    if (!user) { nav("/auth?mode=register"); return; }
    setLoadingId(id);
    try {
      const r = await api.post("/checkout/session", { package_id: id, origin_url: window.location.origin });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-center mb-16">
        <div className="pill mb-4 uppercase font-mono mx-auto inline-flex">Pricing</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-3">Simple Pricing, <span className="gradient-text">Powerful Results</span></h1>
        <p className="text-[#a89dc9] max-w-xl mx-auto">Choose the plan that fits your creative flow. Cancel or upgrade anytime.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
              <span className="font-display text-5xl tracking-tighter">${p.price}</span>
              <span className={`text-sm ${p.popular ? "opacity-70" : "text-[#a89dc9]"}`}>/month</span>
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
              onClick={() => buy(p.id)}
              disabled={loadingId === p.id}
              className={`w-full py-3 rounded-xl font-medium transition ${
                p.popular
                  ? "bg-black text-white hover:bg-black/80"
                  : "gradient-purple text-white hover:opacity-90"
              }`}
            >
              {loadingId === p.id ? "Loading…" : p.price === 0 ? "Get Started" : "Start Free Trial"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#6b6188] mt-12 font-mono">
        Powered by Stripe. Test mode active — use card 4242 4242 4242 4242 to try checkout.
      </p>
    </div>
  );
}
