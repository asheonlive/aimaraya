import React from "react";

const SECTIONS = [
  { h: "1. Acceptance", b: "By creating an account or using AI MARAYA, you agree to these Terms of Service. If you don't agree, please don't use the service." },
  { h: "2. The Service", b: "AI MARAYA is a hosted AI generation platform providing text-to-image and text-to-video via curated frontier models. Availability, model lineup and credit costs may evolve." },
  { h: "3. Account & Eligibility", b: "You must be at least 13 years old. You're responsible for keeping your credentials secure and for all activity under your account." },
  { h: "4. Credits & Payment", b: "Paid plans grant a monthly credit balance. Unused credits roll over up to 2× the monthly quota. Credits are non-refundable except where required by law. Cancel anytime — access continues to the end of the current billing period." },
  { h: "5. Acceptable Use", b: "You may not use AI MARAYA to generate CSAM, non-consensual sexual content, deepfakes intended to defame or harass, content promoting real-world violence, or content that infringes third-party rights. We reserve the right to suspend accounts that violate this policy." },
  { h: "6. Content Ownership", b: "You own the prompts you write and the outputs generated for you, subject to the underlying model providers' terms. Free-tier outputs are for personal use; paid tiers include a commercial-use license." },
  { h: "7. Service Availability", b: "We aim for high availability but don't guarantee uninterrupted service. Model providers may occasionally return errors — failed generations are refunded automatically in credits." },
  { h: "8. Disclaimer & Liability", b: "AI MARAYA is provided \"as is\". To the maximum extent permitted by law, we're not liable for indirect or consequential damages. Our total liability in any 12-month period is capped at the fees you paid us in that period." },
  { h: "9. Termination", b: "You may close your account at any time. We may suspend or terminate accounts for violations of these terms with reasonable notice, except in cases of severe abuse where immediate action is required." },
  { h: "10. Governing Law", b: "These terms are governed by the laws of the United Arab Emirates. Disputes are resolved in the courts of Dubai, UAE." },
  { h: "11. Changes", b: "We may update these terms; material changes are communicated by email at least 30 days in advance." },
  { h: "12. Contact", b: "legal@aimaraya.com" },
];

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <div className="pill mb-6 uppercase font-mono inline-flex">Legal</div>
      <h1 className="font-display text-5xl tracking-tighter mb-3">Terms of Service</h1>
      <p className="text-sm text-[#a89dc9] mb-12">Last updated: February 2026</p>
      <div className="space-y-8">
        {SECTIONS.map(s => (
          <section key={s.h}>
            <h2 className="font-display text-xl tracking-tight mb-2">{s.h}</h2>
            <p className="text-sm text-[#a89dc9] leading-relaxed">{s.b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
