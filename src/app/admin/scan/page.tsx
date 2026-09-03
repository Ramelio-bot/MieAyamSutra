"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, ScanLine, User } from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone: string;
  stamps_count: number;
}

export default function CashierScanPage() {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [stampsToAdd, setStampsToAdd] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (scannedId) return;

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Assume decodedText is member ID (UUID)
        if (decodedText.length === 36) { // UUID length check
          scanner.clear();
          setScannedId(decodedText);
          fetchMember(decodedText);
        }
      },
      (error) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scannedId]);

  const fetchMember = async (id: string) => {
    setLoading(true);
    setSuccessMsg("");
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setMember(data);
    } else {
      alert("Member tidak ditemukan!");
      handleReset();
    }
    setLoading(false);
  };

  const handleAddStamps = async () => {
    if (!member || stampsToAdd <= 0) return;
    setLoading(true);

    try {
      // 1. Insert log (Admin RLS policy applies, relies on PIN if you passed it via header or if disabled)
      // Since we don't have global state for PIN in this isolated page, we'll just insert.
      // If RLS blocks it, you'll need to set up auth or pass the PIN to supabase client headers.
      // Assuming RLS is configured or disabled for this MVP:
      const { error: logError } = await supabase
        .from("stamp_logs")
        .insert([{ member_id: member.id, stamps_added: stampsToAdd, cashier_note: "Added via scanner" }]);

      if (logError) throw logError;

      // 2. Update member count
      const { error: updateError } = await supabase
        .from("members")
        .update({ stamps_count: member.stamps_count + stampsToAdd })
        .eq("id", member.id);

      if (updateError) throw updateError;

      setSuccessMsg(`Berhasil menambahkan ${stampsToAdd} stamp!`);
      // Update local member
      setMember({ ...member, stamps_count: member.stamps_count + stampsToAdd });
      setStampsToAdd(1);
    } catch (err: any) {
      alert("Gagal menambahkan stamp: " + err.message);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setScannedId(null);
    setMember(null);
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Kasir Scanner</h1>
          <p className="text-zinc-500 font-medium">Scan QR Code pelanggan untuk tambah stamp.</p>
        </div>

        {!scannedId ? (
          <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden">
            <div id="qr-reader" className="w-full border-none rounded-xl overflow-hidden"></div>
          </div>
        ) : loading && !member ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gold w-10 h-10" />
          </div>
        ) : member ? (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-charcoal text-gold p-3 rounded-full">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-charcoal uppercase tracking-widest">{member.name}</h2>
                  <p className="text-sm font-bold text-zinc-400">{member.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Stamp</p>
                <p className="text-3xl font-black text-gold">{member.stamps_count}</p>
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center">
                {successMsg}
              </div>
            )}

            <div className="space-y-4 pt-2">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Tambahkan Stamp Baru</label>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => setStampsToAdd(Math.max(1, stampsToAdd - 1))}
                  className="w-12 h-12 rounded-full bg-zinc-100 text-charcoal flex items-center justify-center hover:bg-zinc-200 transition-colors font-black text-xl"
                >-</button>
                <span className="text-4xl font-black text-charcoal w-16 text-center">{stampsToAdd}</span>
                <button 
                  onClick={() => setStampsToAdd(stampsToAdd + 1)}
                  className="w-12 h-12 rounded-full bg-zinc-100 text-charcoal flex items-center justify-center hover:bg-zinc-200 transition-colors font-black text-xl"
                >+</button>
              </div>
            </div>

            <button 
              onClick={handleAddStamps}
              disabled={loading}
              className="w-full bg-charcoal text-white font-black py-4 rounded-xl hover:bg-gold transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Plus size={18} /> Tambah Stamp</>}
            </button>

            <button 
              onClick={handleReset}
              className="w-full bg-white text-charcoal border-2 border-zinc-200 font-black py-4 rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2"
            >
              <ScanLine size={18} /> Scan QR Lain
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
