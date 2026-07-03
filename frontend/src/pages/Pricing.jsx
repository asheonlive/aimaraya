import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  { id: "starter", name: "Starter", price: "$12", credits: "3,000 credits",
    perks: ["3,000 generation credits", "All image & video models", "No expiry"] },
  { id: "pro", name: "Pro", price: "$29", credits: "10,000 credits", popular: true,
    perks: ["10,000 generation credits", "All image & video models", "Priority queue", "No expiry"] },
  { id: "ultra", name: "Ultra", price: "$59", credits: "30,000 credits",
    perks: ["30,000 generation credits", "All image & video models", "Priority queue", "No expiry"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loadingId, setLoadingId] = useState(null);

  const buy = async (packageId) => {
    if (!user) { nav("/auth"); return; }
    setLoadingId(packageId);
    try {
      const res = await api.post("/checkout/session", {
        package_id: packageId,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not start checkout");
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-center mb-16">
        <div className="pill mb-4 uppercase font-mono mx-auto inline-flex">Pricing</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-3">Simple Pricing, <span className="gradient-text">Powerful Results</span></h1>
        <p className="text-[#a89dc9] max-w-xl mx-auto">Buy credits once, use them on any model, any time. Secure checkout via Stripe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {PLANS.map(p => (
          <div key={p.id} className={`relative rounded-2xl p-8 hover-lift flex flex-col ${
            p.popular
              ? "gradient-purple text-white shadow-[0_20px_60px_-15px_rgba(168,85,247,0.5)]"
              : "card-purple"
          }`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full">Most Popular</span>}
            <div className="text-sm mb-1 flex items-center gap-1">
              {p.popular && <Sparkles className="w-3.5 h-3.5" />}
              {p.credits}
            </div>
            <div className="text-2xl font-medium mb-4">{p.name}</div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-5xl tracking-tighter">{p.price}</span>
              <span className={`text-sm ${p.popular ? "opacity-70" : "text-[#a89dc9]"}`}>one-time</span>
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
              {loadingId === p.id ? "Redirecting…" : user ? "Buy credits" : "Sign in to buy"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#6b6188] mt-12 font-mono">
        Secure payment processing by Stripe. Credits never expire.
      </p>
    </div>
  );
}
