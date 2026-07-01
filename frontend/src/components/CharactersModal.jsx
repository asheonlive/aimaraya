import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { api, resolveMedia } from "@/lib/api";
import { X, Plus, Upload, Trash2, User as UserIcon } from "lucide-react";

/** Modal for managing and picking character references. */
export default function CharactersModal({ open, onClose, onPick }) {
  const [chars, setChars] = useState([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { if (open) load(); }, [open]);

  const load = async () => {
    try { const r = await api.get("/characters"); setChars(r.data.characters || []); } catch {}
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const create = async () => {
    if (!name.trim() || !file) return toast.error("Add a name and image");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("file", file);
      await api.post("/characters", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setName(""); setFile(null); setPreview(null);
      toast.success("Character saved");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Upload failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/characters/${id}`); load(); } catch {}
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-3xl card-purple p-8 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button data-testid="chars-close" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-white/70"><X className="w-4 h-4" /></button>
        <h2 className="font-display text-2xl tracking-tighter mb-1">Characters</h2>
        <p className="text-sm text-[#a89dc9] mb-6">Save reusable characters and inject them into any prompt.</p>

        {/* Upload new */}
        <div className="border border-dashed border-[#a855f7]/40 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => fileRef.current?.click()} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-white/25 bg-white/5 hover:border-[#a855f7] transition flex items-center justify-center relative">
              {preview
                ? <img src={preview} alt="" className="w-full h-full object-cover" />
                : <Upload className="w-6 h-6 text-white/60" />}
            </button>
            <input ref={fileRef} data-testid="chars-file" type="file" accept="image/*" onChange={onFile} className="hidden" />
            <div className="flex-1 space-y-2">
              <input data-testid="chars-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Character name (e.g., Aria, Neon Samurai)" className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#a855f7]" />
              <button data-testid="chars-save" onClick={create} disabled={busy} className="btn-primary w-full !py-2 text-sm">{busy ? "Uploading…" : "Save Character"}</button>
            </div>
          </div>
        </div>

        {/* Existing characters */}
        {chars.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#a89dc9]">No characters yet. Upload one above.</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {chars.map(c => (
              <div key={c.id} className="relative group">
                <button data-testid={`chars-pick-${c.id}`} onClick={() => { onPick(c); onClose(); }} className="block w-full text-left">
                  <div className="aspect-square rounded-xl overflow-hidden border border-[#2a2340] group-hover:border-[#a855f7] transition">
                    <img src={resolveMedia(c.image_url)} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs mt-1.5 truncate">{c.name}</div>
                </button>
                <button onClick={() => remove(c.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur text-white/70 hover:text-[#ff3b7a] opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
