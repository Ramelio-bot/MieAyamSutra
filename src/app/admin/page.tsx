"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Bell, BellOff, Database, ShoppingBag, Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/constants";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  shortId: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: OrderItem[];
  total_amount: number;
  status: "PENDING" | "PREPARING" | "COMPLETED" | "CANCELLED";
}

const MOCK_PENDING_ORDERS: Order[] = [
  {
    id: "ord-2001",
    shortId: "2001",
    time: "13:10 WIB",
    customer_name: "Hendra Wijaya",
    customer_phone: "08991234567",
    delivery_address: "Kost Pondok Salib, Gang Belimbing No 2, Salatiga",
    total_amount: 35000,
    status: "PENDING",
    items: [
      { name: "Mie Ayam Biasa", qty: 1, price: 15000, notes: "Ekstra sawi" },
      { name: "Mie Ayam Bakso", qty: 1, price: 20000 }
    ]
  }
];

const MOCK_PREPARING_ORDERS: Order[] = [
  {
    id: "ord-1001",
    shortId: "1001",
    time: "12:30 WIB",
    customer_name: "Budi Santoso",
    customer_phone: "08123456789",
    delivery_address: "Kost Pondok Hijau, Gang Sawo No 4, Sidorejo, Salatiga",
    total_amount: 45000,
    status: "PREPARING",
    items: [
      { name: "Mie Ayam Biasa", qty: 2, price: 15000, notes: "Mienya agak lembek ya" },
      { name: "Mie Ayam Bakso", qty: 1, price: 20000, notes: "Tanpa daun bawang" }
    ]
  }
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Audio state
  const [isAlerting, setIsAlerting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const [prevPreparingCount, setPrevPreparingCount] = useState(0);

  // Helper to map DB row to State structure
  const mapDbOrderToKdsOrder = (dbOrder: any): Order => {
    const date = new Date(dbOrder.created_at);
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} WIB`;
    return {
      id: dbOrder.id,
      shortId: dbOrder.id.substring(0, 4).toUpperCase(),
      time: timeStr,
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      delivery_address: dbOrder.delivery_address,
      total_amount: Number(dbOrder.total_amount),
      status: dbOrder.status,
      items: dbOrder.items
    };
  };

  // Sound Synthesizer: Soft notification chime (played once on new pending order)
  const playSubtleChime = () => {
    try {
      if (typeof window === "undefined") return;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const tones = [987.77, 1318.51]; // B5 and E6

      tones.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch (e) {
      console.error("Audio Context error:", e);
    }
  };

  // Sound alarm: Loud repeating buzzer (played while any PREPARING order is cooking)
  const startAlarm = () => {
    if (isAlerting) return;
    setIsAlerting(true);
    if (typeof window === "undefined") return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioCtxRef.current;
    
    audioIntervalRef.current = setInterval(() => {
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const tones = [880, 1318]; // A5 and E6
      
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6 + idx * 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + 0.6 + idx * 0.05);
      });
    }, 900);
  };

  const stopAlarm = () => {
    setIsAlerting(false);
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  // Check auth state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sutra_staff_token");
      if (token !== "8888") {
        alert("Akses ditolak! Silakan login melalui Portal Staf di halaman utama.");
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [router]);

  // Load orders & Subscribe to all updates
  useEffect(() => {
    if (!isAuthorized) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
    
    setIsMockMode(isPlaceholder);

    if (isPlaceholder) {
      setOrders([...MOCK_PENDING_ORDERS, ...MOCK_PREPARING_ORDERS]);
      return;
    }

    // Fetch initial pending & preparing orders
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["PENDING", "PREPARING"])
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setOrders(data.map(mapDbOrderToKdsOrder));
      }
    };

    fetchOrders();

    // Subscribe to all inserts/updates on 'orders'
    const channel = supabase
      .channel("command-center-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = mapDbOrderToKdsOrder(payload.new);
          if (newOrder.status === "PENDING" || newOrder.status === "PREPARING") {
            setOrders(prev => [newOrder, ...prev]);
            if (newOrder.status === "PENDING") {
              playSubtleChime();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updatedOrder = mapDbOrderToKdsOrder(payload.new);
          if (updatedOrder.status === "PENDING" || updatedOrder.status === "PREPARING") {
            setOrders(prev => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              } else {
                return [updatedOrder, ...prev];
              }
            });
          } else {
            // COMPLETED or CANCELLED: remove from active view
            setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  // Sync alarm state on order updates: Auto unmute on new cooking orders
  useEffect(() => {
    if (!isAuthorized) return;
    const preparingCount = orders.filter(o => o.status === "PREPARING").length;
    if (preparingCount > prevPreparingCount) {
      setIsMuted(false); // Unmute immediately when a new KDS order lands
    }
    setPrevPreparingCount(preparingCount);
  }, [orders, prevPreparingCount, isAuthorized]);

  // Sync Audio Buzzer Playback
  useEffect(() => {
    if (!isAuthorized) return;
    const hasPreparing = orders.some(o => o.status === "PREPARING");
    if (hasPreparing && !isMuted) {
      startAlarm();
    } else {
      stopAlarm();
    }
  }, [orders, isMuted, isAuthorized]);

  // Cleanup Web Audio elements on component unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);

  // Simulator
  const handleSimulateOrder = async (targetStatus: "PENDING" | "PREPARING") => {
    const nextId = (targetStatus === "PENDING" ? 2000 : 1000) + orders.length + 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

    const mockOrderData = {
      customer_name: ["Bayu", "Dewi", "Rian", "Cynthia"][Math.floor(Math.random() * 4)],
      customer_phone: "08" + Math.floor(Math.random() * 90000000 + 10000000),
      delivery_address: [
        "Jalan Patimura No.45, Salatiga",
        "Kos Puteri Kemuning No.18, Sidorejo, Salatiga",
        "Jl. Argoboga No.8, Argomulyo, Salatiga"
      ][Math.floor(Math.random() * 3)],
      total_amount: targetStatus === "PENDING" ? 35000 : 45000,
      status: targetStatus,
      items: targetStatus === "PENDING" 
        ? [
            { name: "Mie Ayam Biasa", qty: 1, price: 15000, notes: "Sayur sawi banyakin" },
            { name: "Mie Ayam Bakso", qty: 1, price: 20000 }
          ]
        : [
            { name: "Mie Ayam Komplit Sutra", qty: 1, price: 25000, notes: "Kuah dipisah" },
            { name: "Es Jeruk Peras", qty: 1, price: 6000 },
            { name: "Es Teh Manis", qty: 2, price: 4000 }
          ]
    };

    if (isMockMode) {
      const newOrder: Order = {
        id: `ord-${nextId}`,
        shortId: String(nextId),
        time: timeStr,
        ...mockOrderData
      };
      setOrders(prev => [newOrder, ...prev]);
      if (targetStatus === "PENDING") {
        playSubtleChime();
      }
    } else {
      const { error } = await supabase.from("orders").insert([mockOrderData]);
      if (error) alert("Error simulating order in DB: " + error.message);
    }
  };

  // Actions
  const handleConfirm = async (id: string) => {
    if (isMockMode) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "PREPARING" as const } : o));
    } else {
      const { error } = await supabase.from("orders").update({ status: "PREPARING" }).eq("id", id);
      if (error) alert("Gagal mengkonfirmasi orderan: " + error.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (isMockMode) {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      const { error } = await supabase.from("orders").update({ status: "CANCELLED" }).eq("id", id);
      if (error) alert("Gagal membatalkan orderan: " + error.message);
    }
  };

  const handleComplete = async (id: string) => {
    if (isMockMode) {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      const { error } = await supabase.from("orders").update({ status: "COMPLETED" }).eq("id", id);
      if (error) alert("Gagal menyelesaikan pesanan: " + error.message);
    }
  };

  const copyToJeggBoy = (order: Order) => {
    const itemsText = order.items.map(item => {
      const noteText = item.notes ? ` (Catatan: ${item.notes})` : '';
      return `- ${item.qty}x ${item.name}${noteText}`;
    }).join('\n');
    
    const text = `*Beli Barang/Belanja*

Nama toko : Mie Ayam Sutra (Pusat Kuliner Kridanggo, Salatiga)

Nama barang dan jumlahnya:
${itemsText}
Total Belanja (Wajib Ditalangi): Rp ${order.total_amount.toLocaleString('id-ID')}

Alamat antar : ${order.delivery_address}

Atas nama : ${order.customer_name}

No penerima : ${order.customer_phone}

Pembayaran cash/transfer: CASH / TALANGAN OJEK ONLINE LOKAL SALATIGA
(Note : Driver yang nalangi belanjaan kita, nanti driver yang menagih ke konsumen/pembeli di lokasi)

(Note : Jika ada gambar bisa dikirim terpisah dari format ya kak)

_Mohon utk pembayaran transfer silahkan transfer dilakukan setelah mendapat nilai total belanja atau saat barang sudah di terima langsung melakukan pembayaran di depan driver_

No rekening dapat pilih salah satu :
- *0131171837 BCA a/n. _Sri Sahono_*
- *1513924853 BNI a/n. _PT Jeggboy Inspirasi Indonesia_*
- *6113017277 Bank Jateng Syariah a/n. _PT Jeggboy inspirasi Indonesia_*
- *1360081888189 Mandiri a/n. _PT Jeggboy Inspirasi Indonesia_*`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500 font-extrabold uppercase tracking-widest text-xs animate-pulse">
          Memverifikasi Otorisasi...
        </p>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const preparingOrders = orders.filter(o => o.status === "PREPARING");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      
      {/* Central Header controls */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs font-black text-zinc-500 hover:text-charcoal px-3 py-2 border border-zinc-200 rounded-xl hover:border-zinc-350 transition-colors uppercase tracking-wider bg-white shadow-xs"
          >
            <ArrowLeft size={14} /> Kembali ke Web
          </Link>
          
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2 text-zinc-900">
            <span>Pusat Kendali Operasional</span>
          </h1>

          <div className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isMockMode ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            <Database size={11} />
            {isMockMode ? "Simulasi" : "Live DB"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute alarm button */}
          {preparingOrders.length > 0 && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm border ${
                isMuted 
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-650 border-zinc-250" 
                  : "bg-red-600 hover:bg-red-750 text-white border-red-700 animate-pulse"
              }`}
            >
              {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
              {isMuted ? "Bunyikan Alarm" : "Senyapkan Alarm"}
            </button>
          )}

          <button 
            onClick={() => handleSimulateOrder("PENDING")}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-zinc-200"
          >
            + Simulasi Order Pending
          </button>
          <button 
            onClick={() => handleSimulateOrder("PREPARING")}
            className="bg-gold hover:bg-yellow-500 text-charcoal font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            + Simulasi Order Dapur
          </button>
        </div>
      </header>

      {/* Split column command panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Admin Verification (Light Mode) */}
        <section className="w-1/2 bg-zinc-50 border-r border-zinc-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 px-6 border-b border-zinc-200 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span>Antrean Pesanan Baru</span>
              <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                {pendingOrders.length}
              </span>
            </h2>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Lakukan Validasi</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {pendingOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                <ShoppingBag size={36} strokeWidth={1.5} />
                <p className="text-xs font-bold tracking-widest uppercase">Tidak ada pesanan baru</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
                    <h3 className="text-lg font-black text-zinc-800">#{order.shortId}</h3>
                    <span className="bg-zinc-200 text-zinc-650 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                      {order.time}
                    </span>
                  </div>

                  <div className="p-4 space-y-4 text-xs">
                    <div className="space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 pb-2 border-b border-zinc-100/50 last:border-0 last:pb-0">
                          <span className="font-extrabold text-gold">{item.qty}x</span>
                          <div className="flex-1">
                            <span className="font-bold text-zinc-800 uppercase tracking-tight block">{item.name}</span>
                            {item.notes && <span className="text-[10px] font-bold text-zinc-400 block italic">Catatan: {item.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-zinc-600">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Konsumen</span>
                        <span className="font-extrabold text-zinc-750 uppercase">{order.customer_name} ({order.customer_phone})</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block tracking-wider">Alamat Kirim</span>
                        <span className="font-semibold text-zinc-500 leading-normal">{order.delivery_address}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-extrabold text-zinc-700 uppercase">Total Harga</span>
                        <span className="font-black text-sm text-zinc-900">{formatRupiah(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex gap-2">
                    <button 
                      onClick={() => handleConfirm(order.id)}
                      className="flex-1 bg-charcoal text-white hover:bg-gold hover:text-charcoal font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Check size={12} /> Kirim Dapur
                    </button>
                    <button 
                      onClick={() => handleCancel(order.id)}
                      className="bg-transparent hover:bg-red-50 text-red-600 border border-zinc-200 hover:border-red-200 font-bold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-widest transition-all"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Kitchen Monitor (Dark Mode KDS) */}
        <section className="w-1/2 bg-zinc-900 flex flex-col h-full overflow-hidden text-zinc-200">
          <div className="p-4 px-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span>Monitor Memasak (KDS)</span>
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                {preparingOrders.length}
              </span>
            </h2>
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Antrean Dapur</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {preparingOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-zinc-600 space-y-3">
                <span className="text-3xl">🍲</span>
                <p className="text-xs font-bold tracking-widest uppercase">Semua masakan selesai</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-zinc-950 rounded-[1.5rem] border-2 border-zinc-850 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/50">
                    <h3 className="text-xl font-black text-white">#{order.shortId}</h3>
                    <span className="bg-zinc-800 text-zinc-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                      {order.time}
                    </span>
                  </div>

                  <div className="p-4 space-y-5">
                    <div className="space-y-3.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
                          <span className="text-xl font-black text-gold leading-none">{item.qty}x</span>
                          <div className="flex-1">
                            <span className="text-lg font-black text-zinc-100 uppercase tracking-tight leading-tight block">{item.name}</span>
                            {item.notes && (
                              <span className="text-xs font-black text-amber-400 block tracking-wide bg-amber-500/10 py-1 px-2.5 rounded-lg border border-amber-500/20 mt-1">
                                CATATAN: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-zinc-900 space-y-2 text-xs text-zinc-400">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-550 block tracking-wider">Pelanggan</span>
                        <span className="font-extrabold text-zinc-200 uppercase text-sm">{order.customer_name} ({order.customer_phone})</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-550 block tracking-wider">Alamat</span>
                        <span className="font-semibold text-zinc-300 leading-normal">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/40 border-t border-zinc-900 flex flex-col gap-2">
                    <button 
                      onClick={() => handleComplete(order.id)}
                      className="w-full bg-gold hover:bg-yellow-500 text-charcoal font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                    >
                      Selesai Masak
                    </button>
                    <button 
                      onClick={() => copyToJeggBoy(order)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-bold py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      {copiedId === order.id ? (
                        <>
                          <Check size={12} className="text-green-500" /> Disalin!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Salin Format Ojol
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Slim credits sub-footer */}
      <footer className="py-2.5 border-t border-zinc-200 bg-white text-center text-[10px] text-zinc-400 tracking-wider shrink-0 font-medium font-sans uppercase">
        Incooperate with Myinvoice.Space | Powered by Digipro
      </footer>

    </div>
  );
}
