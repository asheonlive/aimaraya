import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Check } from "lucide-react";

const FEATURES = {
  starter: ["100 credits", "All image models", "Standard support", "4K resolution"],
  pro: ["500 credits", "All image + video models", "Priority queue", "Reference images", "Commercial use"],
  premium: ["2000 credits", "Everything in Pro", "Early access models", "Dedicated support", "API access (soon)"],
};

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => { api.get("/packages").then(r => setPackages(r.data.packages)); }, []);

  const buy = async (id) => {
    if (!user) { nav("/auth?mode=register"); return; }
    setLoadingId(id);
    try {
      const r = await api.post("/checkout/session", {
        package_id: id,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// PRICING</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-4">One balance. Every model.</h1>
        <p className="text-[#A1A1AA] max-w-xl mx-auto">Top up credits whenever. No subscriptions, no surprises.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#27272A] border border-[#27272A]">
        {packages.map((pkg, i) => {
          const featured = pkg.id === "pro";
          return (
            <div key={pkg.id} className={`bg-[#050505] p-10 relative ${featured ? "ring-1 ring-[#E1FF01]" : ""}`}>
              {featured && (
                <span className="absolute top-4 right-4 bg-[#E1FF01] text-black text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1">Popular</span>
              )}
              <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">{pkg.name} pack</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-6xl tracking-tighter">${pkg.amount}</span>
              </div>
              <div className="text-sm text-[#A1A1AA] mb-8">{pkg.credits} credits · one-time</div>
              <ul className="space-y-3 mb-10">
                {FEATURES[pkg.id]?.map(f => (
                  <li key={f} className="text-sm flex items-center gap-3"><Check className="w-4 h-4 text-[#E1FF01]" /> {f}</li>
                ))}
              </ul>
              <button
                data-testid={`buy-${pkg.id}`}
                onClick={() => buy(pkg.id)}
                disabled={loadingId === pkg.id}
                className={`w-full py-4 font-medium transition-all ${featured ? "bg-[#E1FF01] text-black hover:-translate-y-1" : "border border-[#27272A] hover:bg-white/5"}`}
              >
                {loadingId === pkg.id ? "Loading..." : `Buy ${pkg.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-[#52525B] mt-10 font-mono">
        Powered by Stripe. Test mode active — use card 4242 4242 4242 4242 to try checkout.
      </p>
    </div>
  );
}
