"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";
import { Loader2, ArrowLeft, Ticket, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  stamps_count: number;
}

interface Coupon {
  id: string;
  reward_title: string;
  stamps_cost: number;
  barcode_code: string;
  status: string;
  created_at: string;
}

const REWARDS_CATALOG_FALLBACK = [
  { id: "1", title: "1 Porsi Pangsit Goreng", stamp_cost: 5, description: "Camilan renyah teman makan mie.", is_active: true },
  { id: "2", title: "1 Porsi Mie Ayam Ori", stamp_cost: 10, description: "Menu andalan kami gratis untuk Anda.", is_active: true },
  { id: "3", title: "Mie Komplit + Es Teh", stamp_cost: 15, description: "Paket kenyang maksimal.", is_active: true }
];

export default function RewardsPage() {
  const [member, setMember] = useState<Member | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"catalog" | "my-coupons">("catalog");

  useEffect(() => {
    const savedPhone = localStorage.getItem("sutra_member_phone");
    const savedPin = localStorage.getItem("sutra_member_pin");
    
    if (savedPhone && savedPin) {
      loadData(savedPhone, savedPin);
    } else {
      window.location.href = "/member";
    }
  }, []);

  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  const loadData = async (phone: string, pin: string) => {
    setLoading(true);
    
    if (isMockMode) {
      setTimeout(() => {
        // Load Catalog
        const mockCatalog = localStorage.getItem("mock_reward_catalog");
        if (mockCatalog) {
          setCatalog(JSON.parse(mockCatalog).filter((r: any) => r.is_active));
        } else {
          setCatalog(REWARDS_CATALOG_FALLBACK);
        }

        const mockMemberStr = localStorage.getItem(`mock_member_${phone}`);
        if (mockMemberStr) {
          const user = JSON.parse(mockMemberStr);
          if (user.pin === pin) {
            setMember(user);
            
            const mockCouponsStr = localStorage.getItem(`mock_coupons_${user.id}`);
            if (mockCouponsStr) {
              // Filter active only
              setCoupons(JSON.parse(mockCouponsStr).filter((c: any) => c.status === "active"));
            }
          } else {
            window.location.href = "/member";
          }
        } else {
          window.location.href = "/member";
        }
        setLoading(false);
      }, 500);
      return;
    }

    // Authenticate
    const { data: memberData } = await supabase.rpc("verify_member_pin", { p_phone: phone, p_pin: pin });
    
    if (memberData && memberData.length > 0) {
      const user = memberData[0];
      setMember(user);
      
      // Fetch dynamic catalog
      const { data: catalogData } = await supabase.from("reward_catalog").select("*").eq("is_active", true).order("stamp_cost", { ascending: true });
      if (catalogData) setCatalog(catalogData);

      // Fetch active coupons
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .eq("member_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
        
      if (couponsData) {
        setCoupons(couponsData);
      }
    } else {
      window.location.href = "/member";
    }
    setLoading(false);
  };

  const handleClaim = async (reward: any) => {
    if (!member || member.stamps_count < reward.stamp_cost) return;
    
    const confirm = window.confirm(`Tukar ${reward.stamp_cost} stamp untuk ${reward.title}?`);
    if (!confirm) return;

    setClaimingId(reward.id);
    
    if (isMockMode) {
      setTimeout(() => {
        const phone = localStorage.getItem("sutra_member_phone");
        const mockMemberStr = localStorage.getItem(`mock_member_${phone}`);
        if (mockMemberStr) {
          const user = JSON.parse(mockMemberStr);
          user.stamps_count -= reward.stamp_cost;
          localStorage.setItem(`mock_member_${phone}`, JSON.stringify(user));
          
          const newCoupon = {
            id: `mock-coupon-${Date.now()}`,
            reward_title: reward.title,
            stamps_cost: reward.stamp_cost,
            barcode_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            status: "active",
            created_at: new Date().toISOString()
          };
          
          const existingCouponsStr = localStorage.getItem(`mock_coupons_${user.id}`);
          const existingCoupons = existingCouponsStr ? JSON.parse(existingCouponsStr) : [];
          localStorage.setItem(`mock_coupons_${user.id}`, JSON.stringify([newCoupon, ...existingCoupons]));
          
          alert("Berhasil! Kupon masuk ke 'Kupon Saya' (Mock Mode)");
          loadData(phone!, localStorage.getItem("sutra_member_pin")!);
          setActiveTab("my-coupons");
        }
        setClaimingId(null);
      }, 800);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("claim_reward", {
        p_member_id: member.id,
        p_reward_title: reward.title,
        p_stamps_cost: reward.stamp_cost
      });

      if (error) {
        alert("Gagal menukar stamp: " + error.message);
      } else {
        alert("Berhasil! Kupon masuk ke 'Kupon Saya'");
        // Reload data
        loadData(localStorage.getItem("sutra_member_phone")!, localStorage.getItem("sutra_member_pin")!);
        setActiveTab("my-coupons");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    
    setClaimingId(null);
  };

  if (loading || !member) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-gold" />
      </div>
    );
  }

  return (
    <div className="py-12 max-w-md mx-auto px-4 animate-in fade-in duration-300">
      <div className="flex items-center mb-8 gap-4">
        <Link href="/member" className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Penukaran</h1>
          <p className="text-sm font-bold text-gold uppercase tracking-widest">{member.stamps_count} Stamp Tersedia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-zinc-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === "catalog" ? "bg-white text-charcoal shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Katalog
        </button>
        <button 
          onClick={() => setActiveTab("my-coupons")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all relative ${
            activeTab === "my-coupons" ? "bg-white text-charcoal shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Kupon Saya
          {coupons.length > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === "catalog" && (
        <div className="space-y-4">
          {catalog.map(reward => {
            const canAfford = member.stamps_count >= reward.stamp_cost;
            return (
              <div key={reward.id} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter mb-1">{reward.title}</h3>
                  <p className="text-xs text-zinc-500 font-medium">{reward.description}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-gold font-black text-xs uppercase tracking-widest">
                    <CheckCircle2 size={16} />
                    {reward.stamp_cost} Stamp
                  </div>
                </div>
                
                <button
                  disabled={!canAfford || claimingId === reward.id}
                  onClick={() => handleClaim(reward)}
                  className={`w-full sm:w-auto px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2 ${
                    canAfford 
                      ? "bg-charcoal text-white hover:bg-zinc-800 shadow-xl" 
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  {claimingId === reward.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tukar"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "my-coupons" && (
        <div className="space-y-6">
          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[2rem] border border-zinc-100 border-dashed">
              <Ticket className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm font-medium">Belum ada kupon aktif.</p>
            </div>
          ) : (
            coupons.map(coupon => (
              <div key={coupon.id} className="bg-gold text-charcoal rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none w-2/3">{coupon.reward_title}</h3>
                    <span className="bg-charcoal text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Aktif</span>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl flex flex-col items-center">
                    <QRCode value={coupon.barcode_code} size={120} level="M" />
                    <p className="mt-3 text-charcoal font-bold tracking-widest text-xs uppercase">{coupon.barcode_code}</p>
                  </div>
                  
                  <p className="text-center text-xs font-bold uppercase tracking-wider mt-5 opacity-80">
                    Tunjukkan Barcode ke Kasir
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
