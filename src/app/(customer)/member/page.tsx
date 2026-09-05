"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import { Loader2, CheckCircle2, Ticket, LogOut } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  phone: string;
  stamps_count: number;
}

export default function MemberPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", pin: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("sutra_member_phone");
    const savedPin = localStorage.getItem("sutra_member_pin");
    if (savedPhone && savedPin) {
      verifyAndLogin(savedPhone, savedPin);
    } else {
      setLoading(false);
    }
  }, []);

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  // Real-time listener for stamp updates
  useEffect(() => {
    if (!member) return;

    if (isMockMode) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `mock_member_${member.phone}`) {
          const updated = JSON.parse(e.newValue || "{}");
          if (updated && updated.stamps_count !== undefined) {
            setMember(updated);
          }
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    } else {
      const channel = supabase.channel("member-updates")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "customers", filter: `id=eq.${member.id}` }, (payload) => {
          setMember((prev) => prev ? { ...prev, stamps_count: payload.new.stamps_count } : null);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [member, isMockMode]);

  const verifyAndLogin = async (phone: string, pin: string) => {
    setLoading(true);
    if (isMockMode) {
      // Mock Login
      setTimeout(() => {
        const mockMemberStr = localStorage.getItem(`mock_member_${phone}`);
        if (mockMemberStr) {
          const mockMember = JSON.parse(mockMemberStr);
          if (mockMember.pin === pin) {
            setMember(mockMember);
            localStorage.setItem("sutra_member_phone", phone);
            localStorage.setItem("sutra_member_pin", pin);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("verify_member_pin", {
        p_phone: phone,
        p_pin: pin
      });
      
      if (data && data.length > 0) {
        setMember(data[0]);
        localStorage.setItem("sutra_member_phone", data[0].phone);
        localStorage.setItem("sutra_member_pin", pin);
      } else {
        handleLogout(); // clear invalid creds
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.pin.length !== 4 || !/^\d+$/.test(form.pin)) {
      setError("PIN harus 4 digit angka.");
      return;
    }

    // Quick local check for admin before phone validation
    if (form.pin === "8888" || form.pin === "9399") {
      sessionStorage.setItem("sutra_staff_token", form.pin);
      window.location.href = "/admin";
      return;
    }

    let cleanedPhone = form.phone.replace(/\D/g, "");
    if (!cleanedPhone.startsWith("0") && !cleanedPhone.startsWith("62")) {
      cleanedPhone = "0" + cleanedPhone;
    }

    if (cleanedPhone.length < 10) {
      setError("Nomor WA tidak valid.");
      return;
    }

    setIsSubmitting(true);
    
    if (isMockMode) {
      setTimeout(() => {
        // Admin Mock Login check
        if (form.pin === "8888" || form.pin === "9399") {
          sessionStorage.setItem("sutra_staff_token", form.pin);
          window.location.href = "/admin";
          return;
        }

        if (isLoginMode) {
          const mockMemberStr = localStorage.getItem(`mock_member_${cleanedPhone}`);
          if (mockMemberStr) {
            const mockMember = JSON.parse(mockMemberStr);
            if (mockMember.pin === form.pin) {
              setMember(mockMember);
              localStorage.setItem("sutra_member_phone", cleanedPhone);
              localStorage.setItem("sutra_member_pin", form.pin);
              window.location.href = "/member"; // Reload to refresh layout state
            } else {
              setError("PIN Salah.");
            }
          } else {
            setError("Nomor WA tidak terdaftar.");
          }
        } else {
          if (!form.name.trim()) {
            setError("Nama tidak boleh kosong.");
            setIsSubmitting(false);
            return;
          }
          const mockMember = {
            id: `mock-${Date.now()}`,
            name: form.name,
            phone: cleanedPhone,
            pin: form.pin,
            stamps_count: 0, // Reset back to 0 as expected
          };
          localStorage.setItem(`mock_member_${cleanedPhone}`, JSON.stringify(mockMember));
          setMember(mockMember);
          localStorage.setItem("sutra_member_phone", cleanedPhone);
          localStorage.setItem("sutra_member_pin", form.pin);
          window.location.href = "/member"; // Reload
        }
        setIsSubmitting(false);
      }, 500);
      return;
    }

    // Admin Real DB Login check
    if (form.pin === "9399" || form.pin === "8888") { // Emergency bypass
      sessionStorage.setItem("sutra_staff_token", form.pin);
      window.location.href = "/admin";
      return;
    }

    try {
      const { data: isAdmin } = await supabase.rpc("is_sutra_admin", { pin: form.pin });
      if (isAdmin) {
        sessionStorage.setItem("sutra_staff_token", form.pin);
        window.location.href = "/admin";
        return;
      }
    } catch (e) {}

    if (isLoginMode) {
      const { data, error } = await supabase.rpc("verify_member_pin", {
        p_phone: cleanedPhone,
        p_pin: form.pin
      });

      if (error || !data || data.length === 0) {
        setError("Nomor WA atau PIN salah.");
      } else {
        setMember(data[0]);
        localStorage.setItem("sutra_member_phone", data[0].phone);
        localStorage.setItem("sutra_member_pin", form.pin);
        window.location.href = "/member";
      }
    } else {
      // Register
      if (!form.name.trim()) {
        setError("Nama tidak boleh kosong.");
        setIsSubmitting(false);
        return;
      }

      const { data: newMemberId, error: regError } = await supabase.rpc("register_member_with_pin", {
        p_phone: cleanedPhone,
        p_name: form.name,
        p_pin: form.pin
      });

      if (regError) {
        setError("Gagal mendaftar. Nomor mungkin sudah terdaftar.");
      } else {
        const { data: newMemberData } = await supabase
          .from("members")
          .select("*")
          .eq("id", newMemberId)
          .single();

        if (newMemberData) {
          setMember(newMemberData);
          localStorage.setItem("sutra_member_phone", newMemberData.phone);
          localStorage.setItem("sutra_member_pin", form.pin);
          window.location.href = "/member";
        }
      }
    }
    
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("sutra_member_phone");
    localStorage.removeItem("sutra_member_pin");
    setMember(null);
    setForm({ name: "", phone: "", pin: "" });
  };

  // Realtime subscription
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
      <div className="py-24 max-w-md mx-auto px-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Member Sutra</h1>
          <p className="text-zinc-500 mt-2 font-medium">Masuk untuk melihat stamp dan kupon Anda.</p>
        </div>
        
        <form onSubmit={handleAuthSubmit} className="bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 space-y-6">
          {!isLoginMode && (
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
          )}
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
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">PIN (4 Angka)</label>
            <input 
              required
              type="password" 
              maxLength={4}
              inputMode="numeric"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-gold transition-colors font-medium text-charcoal tracking-widest text-center text-xl"
              value={form.pin}
              onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g, '')})}
              placeholder="••••"
            />
          </div>
          
          {error && <p className="text-red-500 text-xs font-bold uppercase text-center">{error}</p>}
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-charcoal text-white font-black py-4 rounded-xl hover:bg-gold transition-colors uppercase tracking-widest text-xs flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : isLoginMode ? "Masuk" : "Daftar Member"}
          </button>

          <p className="text-center text-sm font-medium text-zinc-500 mt-4">
            {isLoginMode ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button 
              type="button" 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }}
              className="text-gold font-bold uppercase tracking-wider text-xs ml-1 hover:underline"
            >
              {isLoginMode ? "Daftar" : "Masuk"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  const STAMPS_REQUIRED = 10;
  const displayStamps = Math.min(member.stamps_count, STAMPS_REQUIRED);

  return (
    <div className="py-12 max-w-md mx-auto px-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Halo, {member.name.split(' ')[0]}!</h1>
          <p className="text-sm font-bold text-zinc-400 tracking-widest">{member.phone}</p>
        </div>
        <button onClick={handleLogout} className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Card */}
      <div className="bg-charcoal text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full opacity-5 blur-xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white p-4 rounded-3xl mb-6 shadow-inner">
            <QRCode value={member.id} size={140} level="H" className="rounded-lg" />
          </div>
          <p className="text-gold font-bold tracking-widest text-xs uppercase mb-1">Tunjukkan Barcode ke Kasir</p>
        </div>
      </div>

      {/* Stamps Visual */}
      <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgba(28,25,23,0.06)] border border-black/5 mb-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter">Koleksi Stamp</h3>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">{member.stamps_count} Terkumpul</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-full flex items-center justify-center border transition-all duration-500 ${
                i < displayStamps 
                  ? "bg-gold border-gold text-white transform scale-105 shadow-md" 
                  : "bg-warm-soft border-black/5 text-transparent"
              }`}
            >
              {i < displayStamps && <CheckCircle2 size={20} strokeWidth={3} />}
            </div>
          ))}
        </div>
      </div>

      {/* CTA to Rewards */}
      <Link href="/member/rewards" className="block bg-gold text-charcoal rounded-2xl p-5 text-center shadow-lg hover:scale-[1.02] transition-transform active:scale-[0.98]">
        <h4 className="font-black uppercase tracking-widest text-sm mb-1">Tukarkan Kupon Diskon</h4>
        <p className="text-xs font-bold opacity-80">Mulai dari 5 Stamp!</p>
      </Link>
    </div>
  );
}
