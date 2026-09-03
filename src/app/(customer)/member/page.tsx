"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import { Loader2, CheckCircle2, Ticket } from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone: string;
  stamps_count: number;
}

export default function MemberPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check local storage for existing session
    const savedPhone = localStorage.getItem("sutra_member_phone");
    if (savedPhone) {
      fetchMember(savedPhone);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMember = async (phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("phone", phone)
        .single();
      
      if (data) {
        setMember(data);
        localStorage.setItem("sutra_member_phone", data.phone);
      } else {
        localStorage.removeItem("sutra_member_phone");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    let cleanedPhone = form.phone.replace(/\D/g, "");
    if (!cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("62")) {
      cleanedPhone = "0" + cleanedPhone;
    }

    if (cleanedPhone.length < 10) {
      setError("Nomor WA tidak valid.");
      return;
    }
    if (!form.name.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    
    // Check if exists first to act as a login
    const { data: existing } = await supabase
      .from("members")
      .select("*")
      .eq("phone", cleanedPhone)
      .single();

    if (existing) {
      setMember(existing);
      localStorage.setItem("sutra_member_phone", existing.phone);
    } else {
      // Register new
      const { data: newMember, error: insertError } = await supabase
        .from("members")
        .insert([{ name: form.name, phone: cleanedPhone }])
        .select()
        .single();
        
      if (insertError) {
        setError("Gagal mendaftar. Silakan coba lagi.");
      } else if (newMember) {
        setMember(newMember);
        localStorage.setItem("sutra_member_phone", newMember.phone);
      }
    }
    
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("sutra_member_phone");
    setMember(null);
    setForm({ name: "", phone: "" });
  };

  const handleClaimReward = async () => {
    if (!member || member.stamps_count < 10) return;
    const confirm = window.confirm("Tukarkan 10 stamp dengan porsi gratis sekarang? Kasir akan memeriksa layar ini.");
    if (!confirm) return;

    // In a real robust system, claims are inserted to `reward_claims` and stamps are deducted via RPC.
    // For simplicity without RPC, we insert claim and update stamp count from client.
    // Note: this is vulnerable to client tampering, but acceptable for MVP.
    const { error } = await supabase
      .from("reward_claims")
      .insert([{ member_id: member.id, reward_title: "1 Porsi Mie Ayam Ori" }]);
    
    if (!error) {
      await supabase
        .from("members")
        .update({ 
          stamps_count: member.stamps_count - 10,
          total_rewards_claimed: (member as any).total_rewards_claimed + 1 
        })
        .eq("id", member.id);
      
      alert("Reward berhasil diklaim! Tunjukkan layar ini ke kasir.");
      fetchMember(member.phone); // refresh
    }
  };

  // Realtime subscription to stamps
  useEffect(() => {
    if (!member) return;
    
    const channel = supabase
      .channel(`member-${member.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "members", filter: `id=eq.${member.id}` },
        (payload) => {
          setMember(payload.new as Member);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [member?.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-gold" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-24 max-w-md mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Member Sutra</h1>
          <p className="text-zinc-500 mt-2 font-medium">Daftar atau masuk dengan WA untuk mulai mengumpulkan stamp.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
            <input 
              required
              type="text" 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-gold transition-colors font-medium text-charcoal"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Contoh: Budi"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">No. WhatsApp</label>
            <input 
              required
              type="tel" 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-gold transition-colors font-medium text-charcoal"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="0812..."
            />
          </div>
          
          {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-charcoal text-white font-black py-4 rounded-xl hover:bg-gold transition-colors uppercase tracking-widest text-xs flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Masuk / Daftar"}
          </button>
        </form>
      </div>
    );
  }

  const STAMPS_REQUIRED = 10;
  const currentStamps = member.stamps_count % STAMPS_REQUIRED; // for UI if they have > 10 without claiming
  // Wait, if they have 12, they can claim 1, and 2 remain. Better just bound to 10 for display.
  const displayStamps = Math.min(member.stamps_count, STAMPS_REQUIRED);

  return (
    <div className="py-16 max-w-md mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Kartu Member</h1>
        <button onClick={handleLogout} className="text-xs font-bold text-zinc-400 hover:text-red-500 uppercase tracking-wider">Keluar</button>
      </div>

      {/* Card */}
      <div className="bg-charcoal text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold rounded-full opacity-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner">
            <QRCode value={member.id} size={150} level="H" className="rounded-lg" />
          </div>
          
          <h2 className="text-xl font-black uppercase tracking-widest">{member.name}</h2>
          <p className="text-zinc-400 font-medium tracking-widest text-sm mt-1">{member.phone}</p>
        </div>
      </div>

      {/* Stamps Visual */}
      <div className="mt-12 bg-white rounded-[2rem] p-8 shadow-lg border border-zinc-100">
        <div className="text-center mb-6">
          <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest">Koleksi Stamp</h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Beli 1 porsi = 1 stamp</p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                i < displayStamps 
                  ? "bg-gold border-gold text-charcoal transform scale-110 shadow-md" 
                  : "bg-zinc-50 border-zinc-200 text-transparent"
              }`}
            >
              {i < displayStamps && <CheckCircle2 size={20} strokeWidth={3} />}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button 
            disabled={member.stamps_count < 10}
            onClick={handleClaimReward}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all ${
              member.stamps_count >= 10 
                ? "bg-charcoal text-white hover:bg-zinc-800 shadow-xl" 
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Ticket size={18} />
            {member.stamps_count >= 10 ? "Klaim Reward (Mie Ori)" : `Kumpulkan ${10 - displayStamps} Stamp Lagi`}
          </button>
        </div>
      </div>
    </div>
  );
}
