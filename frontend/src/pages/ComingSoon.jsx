import React from "react";
import { Sparkles } from "lucide-react";

export default function ComingSoon({ title = "Coming soon", tagline = "This tool is on its way. Stay tuned." }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="card-purple p-14 text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-purple flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-3xl tracking-tighter mb-3">{title}</h1>
        <p className="text-white/60 text-sm">{tagline}</p>
      </div>
    </div>
  );
}
