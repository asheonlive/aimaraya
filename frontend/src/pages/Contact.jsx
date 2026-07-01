import React, { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Send, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General inquiry");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) return toast.error("Fill all fields");
    setSending(true);
    // Compose mailto so the user's mail client picks it up — no backend needed.
    const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${encodeURIComponent(message)}`;
    window.location.href = `mailto:hello@aimaraya.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    setTimeout(() => { setSending(false); toast.success("Opening your email app…"); }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
      <div className="pill mb-6 uppercase font-mono inline-flex">Contact</div>
      <h1 className="font-display text-5xl md:text-6xl tracking-tighter mb-3">Get in touch.</h1>
      <p className="text-[#a89dc9] max-w-xl mb-12">
        Questions, partnerships, press or just want to say hi — we usually reply within one business day.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact info */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { i: Mail,          t: "Email",     v: "hello@aimaraya.com",   href: "mailto:hello@aimaraya.com" },
            { i: MessageCircle, t: "Support",   v: "support@aimaraya.com", href: "mailto:support@aimaraya.com" },
            { i: MapPin,        t: "Office",    v: "Dubai, United Arab Emirates" },
            { i: Clock,         t: "Response",  v: "Within 24 hours" },
          ].map(({ i: Icon, t, v, href }) => (
            <a key={t} href={href || "#"} className="card-purple p-5 flex items-start gap-3 hover-lift block">
              <div className="w-9 h-9 shrink-0 rounded-lg gradient-purple-soft border border-[#a855f7]/30 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#c084fc]" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1">{t}</div>
                <div className="text-sm text-white">{v}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="lg:col-span-3 card-purple p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1.5 block">Name</label>
              <input data-testid="contact-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0d0919] border border-[#2a2340] focus:border-[#a855f7] rounded-xl px-4 py-3 text-sm outline-none transition-colors" placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1.5 block">Email</label>
              <input data-testid="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0d0919] border border-[#2a2340] focus:border-[#a855f7] rounded-xl px-4 py-3 text-sm outline-none transition-colors" placeholder="you@studio.com" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1.5 block">Subject</label>
            <select data-testid="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-[#0d0919] border border-[#2a2340] focus:border-[#a855f7] rounded-xl px-4 py-3 text-sm outline-none transition-colors">
              <option>General inquiry</option>
              <option>Sales & partnerships</option>
              <option>Technical support</option>
              <option>Press</option>
              <option>Bug report</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-1.5 block">Message</label>
            <textarea data-testid="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full bg-[#0d0919] border border-[#2a2340] focus:border-[#a855f7] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none" placeholder="Tell us more…" />
          </div>
          <button data-testid="contact-submit" type="submit" disabled={sending} className="btn-primary inline-flex items-center gap-2 w-full justify-center">
            {sending ? "Opening…" : <>Send Message <Send className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
