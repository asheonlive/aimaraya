import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking"); // checking | paid | pending | error
  const [creditsAdded, setCreditsAdded] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await api.get(`/checkout/status/${sessionId}`);
        if (res.data.payment_status === "paid") {
          setCreditsAdded(res.data.credits_added || 0);
          setStatus("paid");
          return;
        }
        attempts += 1;
        if (attempts < 6) setTimeout(poll, 2000);
        else setStatus("pending");
      } catch {
        setStatus("error");
      }
    };
    poll();
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="card-purple p-12">
        {status === "checking" && (
          <>
            <Loader2 className="w-16 h-16 text-[#a855f7] mx-auto mb-6 animate-spin" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Confirming payment…</h1>
            <p className="text-[#a89dc9] mb-8">This usually takes just a few seconds.</p>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Payment successful</h1>
            <p className="text-[#a89dc9] mb-8">
              {creditsAdded ? `${creditsAdded.toLocaleString()} credits added to your account.` : "Your credits have been added."}
            </p>
            <Link to="/app" className="gradient-purple text-white px-6 py-3 rounded-xl font-medium inline-block">Open studio</Link>
          </>
        )}
        {status === "pending" && (
          <>
            <Loader2 className="w-16 h-16 text-[#a855f7] mx-auto mb-6" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Still processing</h1>
            <p className="text-[#a89dc9] mb-8">Your payment is being confirmed. Credits will appear on your profile shortly.</p>
            <Link to="/app" className="border border-[#2a2340] px-6 py-3 rounded-xl inline-block">Go to studio</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h1 className="font-display text-4xl tracking-tighter mb-3">Couldn't confirm payment</h1>
            <p className="text-[#a89dc9] mb-8">If you completed checkout, contact support with your order details.</p>
            <Link to="/pricing" className="border border-[#2a2340] px-6 py-3 rounded-xl inline-block">Back to pricing</Link>
          </>
        )}
      </div>
    </div>
  );
}
