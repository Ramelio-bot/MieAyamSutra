"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, ScanLine, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  phone: string;
  stamps_count: number;
}

export default function CashierScanPage() {
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [scannedCoupon, setScannedCoupon] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [stampsToAdd, setStampsToAdd] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  useEffect(() => {
    let cancelled = false;

    async function fetchReadyOrders() {
      if (isMockMode) {
        const stored = localStorage.getItem("mock_orders");
        if (stored) {
          const allOrders = JSON.parse(stored);
          const ready = allOrders.filter((o: any) => o.status === "WAITING_PICKUP");
          if (!cancelled) setReadyOrders(ready);
        } else {
          if (!cancelled) setReadyOrders([]);
        }
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "WAITING_PICKUP")
        .order("updated_at", { ascending: false });
      
      if (data && !cancelled) setReadyOrders(data);
    }
    
    if (isAuthorized) {
      fetchReadyOrders();

      let interval: NodeJS.Timeout;
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "mock_orders") {
          fetchReadyOrders();
        }
      };

      if (isMockMode) {
        window.addEventListener("storage", handleStorageChange);
      } else {
        // Polling for ready orders every 10 seconds for live DB (or could use realtime)
        interval = setInterval(fetchReadyOrders, 10000);
      }

      return () => {
        cancelled = true;
        if (isMockMode) {
          window.removeEventListener("storage", handleStorageChange);
        } else {
          clearInterval(interval);
        }
      };
    }
  }, [isAuthorized, isMockMode]);

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
        scanner.clear();
        setScannedId(decodedText);
        
        // Is it a Member UUID?
        if (decodedText.length === 36) {
          fetchMember(decodedText);
        } else {
          // Otherwise, treat as Coupon Barcode
          fetchCoupon(decodedText);
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
    setErrorMsg("");

    if (isMockMode) {
      setTimeout(() => {
        // Find member in local storage matching ID
        let found = null;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("mock_member_")) {
            const m = JSON.parse(localStorage.getItem(key)!);
            if (m.id === id) found = m;
          }
        }
        if (found) {
          setMember(found);
        } else {
          setErrorMsg("Member tidak ditemukan di Mock Mode!");
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();
    if (data) {
      setMember(data);
    } else {
      setErrorMsg("Member tidak ditemukan!");
    }
    setLoading(false);
  };

  const fetchCoupon = async (barcode: string) => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (isMockMode) {
      setTimeout(() => {
        let foundCoupon = null;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("mock_coupons_")) {
            const coupons = JSON.parse(localStorage.getItem(key)!);
            const c = coupons.find((c: any) => c.barcode_code === barcode);
            if (c) foundCoupon = { ...c, member_id: key.replace("mock_coupons_", "") };
          }
        }

        if (foundCoupon) {
          setScannedCoupon(foundCoupon);
        } else {
          setErrorMsg("Kupon tidak ditemukan atau tidak valid.");
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data, error } = await supabase.from("coupons").select("*").eq("barcode_code", barcode).single();
    if (data) {
      setScannedCoupon(data);
    } else {
      setErrorMsg("Kupon tidak valid / tidak ditemukan.");
    }
    setLoading(false);
  };

  const handleAddStamps = async () => {
    if (!member || stampsToAdd <= 0) return;
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        let phone = null;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("mock_member_")) {
            const m = JSON.parse(localStorage.getItem(key)!);
            if (m.id === member.id) phone = m.phone;
          }
        }
        if (phone) {
          const m = JSON.parse(localStorage.getItem(`mock_member_${phone}`)!);
          m.stamps_count += stampsToAdd;
          localStorage.setItem(`mock_member_${phone}`, JSON.stringify(m));
          setSuccessMsg(`Berhasil menambahkan ${stampsToAdd} stamp! (Mock Mode)`);
          setMember(m);
          setStampsToAdd(1);
        }
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const { error: logError } = await supabase
        .from("stamp_logs")
        .insert([{ member_id: member.id, stamps_added: stampsToAdd, cashier_note: "Added via scanner" }]);

      if (logError) throw logError;

      const { error: updateError } = await supabase
        .from("members")
        .update({ stamps_count: member.stamps_count + stampsToAdd })
        .eq("id", member.id);

      if (updateError) throw updateError;

      setSuccessMsg(`Berhasil menambahkan ${stampsToAdd} stamp!`);
      setMember({ ...member, stamps_count: member.stamps_count + stampsToAdd });
      setStampsToAdd(1);
    } catch (err: any) {
      alert("Gagal menambahkan stamp: " + err.message);
    }
    setLoading(false);
  };

  const handleUseCoupon = async () => {
    if (!scannedCoupon) return;
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        const memberId = scannedCoupon.member_id;
        const key = `mock_coupons_${memberId}`;
        const couponsStr = localStorage.getItem(key);
        if (couponsStr) {
          const coupons = JSON.parse(couponsStr);
          const idx = coupons.findIndex((c: any) => c.barcode_code === scannedCoupon.barcode_code);
          if (idx !== -1) {
            coupons[idx].status = "used";
            coupons[idx].used_at = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(coupons));
            setScannedCoupon(coupons[idx]);
            setSuccessMsg("Kupon berhasil dihanguskan! (Mock Mode)");
          }
        }
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const staffPin = sessionStorage.getItem("sutra_staff_token") || "";
      const { data, error } = await supabase.rpc("use_coupon", {
        p_coupon_id: scannedCoupon.id,
        p_staff_pin: staffPin
      });

      if (error) throw error;
      setSuccessMsg("Kupon berhasil dihanguskan!");
      setScannedCoupon({ ...scannedCoupon, status: "used" });
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setScannedId(null);
    setMember(null);
    setScannedCoupon(null);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (isMockMode) {
      const stored = localStorage.getItem("mock_orders");
      if (stored) {
        let allOrders = JSON.parse(stored);
        allOrders = allOrders.map((o: any) => o.id === orderId ? { ...o, status: "PICKED_UP" } : o);
        localStorage.setItem("mock_orders", JSON.stringify(allOrders));
      }
      setReadyOrders(prev => prev.filter(o => o.id !== orderId));
      return;
    }
    const token = sessionStorage.getItem("sutra_staff_token");
    await supabase.from("orders").update({ status: "PICKED_UP", updated_by: token, updated_at: new Date().toISOString() }).eq("id", orderId);
    setReadyOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-md mx-auto relative">
        <Link 
          href="/admin" 
          className="absolute -left-16 top-1 p-3 bg-white text-zinc-400 hover:text-charcoal hover:bg-zinc-100 rounded-2xl shadow-sm border border-zinc-200 transition-colors hidden sm:flex"
        >
          <ArrowLeft size={24} />
        </Link>

        {/* Mobile back button */}
        <div className="sm:hidden mb-6 flex justify-start">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 p-2 px-4 bg-white text-zinc-500 hover:text-charcoal rounded-xl shadow-sm border border-zinc-200 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> Kembali ke Pusat Kendali
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Kasir Scanner</h1>
          <p className="text-zinc-500 font-medium">Scan QR Code pelanggan untuk tambah stamp.</p>
        </div>

        {!scannedId ? (
          <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden">
            <div id="qr-reader" className="w-full border-none rounded-xl overflow-hidden"></div>
            {errorMsg && (
              <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest mt-4">{errorMsg}</p>
            )}
          </div>
        ) : loading && !member && !scannedCoupon ? (
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
        ) : scannedCoupon ? (
          <div className={`p-8 rounded-[2rem] shadow-xl border-2 space-y-6 animate-in fade-in zoom-in duration-300 ${
            scannedCoupon.status === 'used' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="text-center pb-6 border-b border-black/10">
              <h2 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${scannedCoupon.status === 'used' ? 'text-red-700' : 'text-emerald-700'}`}>
                Validasi Kupon
              </h2>
              <div className="inline-block bg-white/60 px-4 py-2 rounded-xl shadow-sm">
                <span className="text-sm font-black text-charcoal tracking-widest uppercase">{scannedCoupon.barcode_code}</span>
              </div>
            </div>

            <div className="text-center py-4">
              <p className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1">Item Reward</p>
              <p className="text-2xl font-black text-charcoal uppercase">{scannedCoupon.reward_title}</p>
              
              <div className="mt-6">
                {scannedCoupon.status === 'used' ? (
                  <div className="bg-red-600 text-white p-4 rounded-xl shadow-lg">
                    <span className="block text-lg font-black uppercase tracking-widest">KUPON TIDAK VALID</span>
                    <span className="block text-xs font-bold mt-1 opacity-90">Kupon ini sudah hangus / pernah ditukarkan.</span>
                  </div>
                ) : (
                  <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg">
                    <span className="block text-lg font-black uppercase tracking-widest">KUPON SAH</span>
                    <span className="block text-xs font-bold mt-1 opacity-90">Siap ditukarkan dengan reward.</span>
                  </div>
                )}
              </div>
            </div>

            {successMsg && (
              <div className="bg-white/80 text-emerald-800 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center shadow-sm">
                {successMsg}
              </div>
            )}

            {scannedCoupon.status === 'active' && (
              <button 
                onClick={handleUseCoupon}
                disabled={loading}
                className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl hover:bg-emerald-600 transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Validasi & Hanguskan Kupon"}
              </button>
            )}

            <button 
              onClick={handleReset}
              className="w-full bg-white text-charcoal border-2 border-zinc-200 font-black py-4 rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2"
            >
              <ScanLine size={18} /> Scan QR Lain
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 text-center">
             <p className="text-red-500 font-bold uppercase tracking-widest">{errorMsg || "Data tidak ditemukan"}</p>
             <button 
              onClick={handleReset}
              className="w-full mt-6 bg-white text-charcoal border-2 border-zinc-200 font-black py-4 rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest text-xs flex justify-center items-center gap-2"
            >
              <ScanLine size={18} /> Coba Scan Lagi
            </button>
          </div>
        )}
        
        {/* Pesanan Siap Saji */}
        <div className="mt-8 bg-white p-6 rounded-[2rem] shadow-xl border border-zinc-100">
          <h2 className="text-lg font-black text-charcoal uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Pesanan Siap Saji
          </h2>
          
          {readyOrders.length === 0 ? (
            <p className="text-sm text-zinc-400 font-medium">Belum ada pesanan yang siap diserahkan.</p>
          ) : (
            <div className="space-y-3">
              {readyOrders.map(order => (
                <div key={order.id} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 flex justify-between items-center">
                  <div>
                    <p className="font-black text-emerald-900">#{order.shortId || order.id.substring(0,4).toUpperCase()}</p>
                    <p className="text-xs font-bold text-emerald-700/70">{order.customer_name}</p>
                  </div>
                  <button onClick={() => handleCompleteOrder(order.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm">
                    Selesai
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
