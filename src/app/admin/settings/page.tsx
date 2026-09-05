"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2, Store, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export default function StoreSettingsPage() {
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
  
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("Maaf, kedai sedang tutup. Silakan kembali lagi nanti.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync to global store to reflect immediately if the admin opens customer UI
  const { setStoreStatus } = useCart();

  useEffect(() => {
    async function loadSettings() {
      if (isMockMode) {
        const status = localStorage.getItem("mock_store_status");
        if (status) {
          const parsed = JSON.parse(status);
          setIsOpen(parsed.is_open);
          setMessage(parsed.closed_message);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
      if (data) {
        setIsOpen(data.is_open);
        setMessage(data.closed_message);
      }
      setLoading(false);
    }
    loadSettings();
  }, [isMockMode]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    if (isMockMode) {
      localStorage.setItem("mock_store_status", JSON.stringify({ is_open: isOpen, closed_message: message }));
      setStoreStatus(isOpen, message);
      setTimeout(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 500);
      return;
    }

    const { error } = await supabase
      .from("store_settings")
      .update({ is_open: isOpen, closed_message: message, updated_at: new Date().toISOString() })
      .eq("id", 1);
    
    if (!error) {
      setStoreStatus(isOpen, message);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-zinc-500 hover:text-charcoal font-bold text-sm uppercase tracking-wider bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-200 transition-all"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Pengaturan Kedai</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm space-y-10">
          
          {/* Toggle Operasional */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Store size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Status Operasional</h2>
                <p className="text-zinc-500 text-sm mt-1">Matikan saklar ini jika kedai sedang tutup, libur, atau kehabisan stok. Pelanggan tidak akan bisa memesan.</p>
              </div>
            </div>

            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-700 uppercase tracking-wider text-sm">Status Saat Ini</p>
                <p className={`font-black text-2xl tracking-tighter ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isOpen ? "KEDAI BUKA" : "KEDAI TUTUP"}
                </p>
              </div>
              
              {/* Custom Toggle Switch */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}
              >
                <span className="sr-only">Toggle store status</span>
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow transition-transform ${isOpen ? 'translate-x-13' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </section>

          {/* Pesan Tutup */}
          {!isOpen && (
            <section className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                  <MessageSquare size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Pesan Pemberitahuan</h2>
                  <p className="text-zinc-500 text-sm mt-1">Pesan ini akan muncul di spanduk merah di bagian atas layar pelanggan saat kedai tutup.</p>
                </div>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal transition-all resize-none font-medium text-zinc-700"
                placeholder="Misal: Kedai sedang libur Idul Fitri..."
              />
            </section>
          )}

          <div className="pt-6 border-t border-zinc-100 flex justify-end items-center gap-4">
            {saveSuccess && <span className="text-emerald-600 font-bold text-sm tracking-wide">Tersimpan!</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-charcoal text-white hover:bg-zinc-800 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
