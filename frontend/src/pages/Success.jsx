import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Success() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id");
  const { refresh } = useAuth();
  const [state, setState] = useState({ status: "pending", payment_status: "unpaid", credits_added: 0, amount_total: 0, currency: "usd" });
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await api.get(`/checkout/status/${sessionId}`);
        setState(r.data);
        if (r.data.payment_status === "paid" || r.data.status === "expired") {
          refresh();
          return;
        }
      } catch {}
      attempts.current += 1;
      if (attempts.current < 10) setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  const paid = state.payment_status === "paid";
  const expired = state.status === "expired";

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="border border-[#27272A] bg-[#0f0f10] p-12">
        {paid ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-[#34C759] mx-auto mb-6" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Payment successful</h1>
            <p className="text-[#A1A1AA] mb-2">+{state.credits_added > 0 ? state.credits_added : ""} credits added to your account.</p>
            <p className="text-xs font-mono text-[#52525B] mb-8">${(state.amount_total/100).toFixed(2)} {state.currency?.toUpperCase()}</p>
          </>
        ) : expired ? (
          <>
            <XCircle className="w-16 h-16 text-[#FF3B30] mx-auto mb-6" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Session expired</h1>
            <p className="text-[#A1A1AA] mb-8">Please try again from the pricing page.</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-[#E1FF01] mx-auto mb-6 animate-spin" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Confirming payment…</h1>
            <p className="text-[#A1A1AA] mb-8">This usually takes a few seconds.</p>
          </>
        )}
        <div className="flex gap-3 justify-center">
          <Link to="/studio" className="bg-[#E1FF01] text-black px-6 py-3 font-medium">Open studio</Link>
          <Link to="/dashboard" className="border border-[#27272A] px-6 py-3">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
