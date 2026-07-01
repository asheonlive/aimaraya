import React from "react";

const SECTIONS = [
  { h: "1. Information We Collect", b: "When you register, we collect your name, email address and hashed password. When you generate content, we store the prompts, model settings and resulting media so you can access them from your dashboard. When you pay, Stripe handles your card data — we only receive a transaction reference." },
  { h: "2. How We Use Information", b: "To operate the service, deliver generations, apply your credit balance, provide customer support, and improve the platform. We never sell your data to third parties." },
  { h: "3. Third-Party Processors", b: "We use Stripe (payments), Comfy Cloud (AI generation), and industry-standard cloud infrastructure. Each processes data only to deliver the AI MARAYA service." },
  { h: "4. Your Content", b: "Prompts and generations you create remain yours. Paid plans include a full commercial-use license. You may delete any generation at any time from My Generations; deletion is permanent within 24 hours." },
  { h: "5. Data Retention", b: "Account data is kept while your account is active. Deleted-account data is purged within 30 days, except where retention is legally required." },
  { h: "6. Your Rights", b: "You may access, correct, export or delete your personal data at any time. Contact us at privacy@aimaraya.com to exercise these rights." },
  { h: "7. Security", b: "We use TLS in transit, at-rest encryption for the database, bcrypt for passwords, and short-lived JWTs for session auth." },
  { h: "8. Children", b: "AI MARAYA is not directed at children under 13. We do not knowingly collect personal information from children." },
  { h: "9. Changes", b: "We'll notify you of material changes via email or in-app banner at least 30 days before they take effect." },
  { h: "10. Contact", b: "Questions? Email privacy@aimaraya.com or use the Contact page." },
];

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <div className="pill mb-6 uppercase font-mono inline-flex">Legal</div>
      <h1 className="font-display text-5xl tracking-tighter mb-3">Privacy Policy</h1>
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
