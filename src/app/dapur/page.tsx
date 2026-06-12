"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, BellRing, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

// Simulated initial orders for KDS in mock mode (already APPROVED by Admin)
const MOCK_INITIAL_ORDERS: Order[] = [
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

export default function KDSPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAlerting, setIsAlerting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  
  // Audio Web API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

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



  // Helper to map DB columns to KDS state structure
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

  // Sound alarm
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

      const tones = [880, 1318];
      
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

  // Check Supabase URL & Setup Database Connection
  useEffect(() => {
    if (!isAuthorized) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
    
    setIsMockMode(isPlaceholder);

    if (isPlaceholder) {
      setOrders(MOCK_INITIAL_ORDERS);
      return;
    }

    // Fetch live approved orders (PREPARING status only)
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PREPARING")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setOrders(data.map(mapDbOrderToKdsOrder));
        if (data.length > 0) startAlarm();
      }
    };

    fetchOrders();

    // Subscribe to realtime updates for orders accepted by Admin (status = 'PREPARING')
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new.status === "PREPARING") {
            const newOrder = mapDbOrderToKdsOrder(payload.new);
            setOrders(prev => [newOrder, ...prev]);
            startAlarm();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updatedOrder = mapDbOrderToKdsOrder(payload.new);
          if (updatedOrder.status === "PREPARING") {
            // New validated order has arrived in kitchen
            setOrders(prev => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              if (exists) return prev;
              return [updatedOrder, ...prev];
            });
            startAlarm();
          } else if (updatedOrder.status === "COMPLETED" || updatedOrder.status === "CANCELLED") {
            // Cleared from kitchen
            setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopAlarm();
    };
  }, [isAuthorized]);

  // Sync alarm with active preparing orders
  useEffect(() => {
    if (!isAuthorized) return;
    const hasPreparing = orders.some(o => o.status === "PREPARING");
    if (!hasPreparing) {
      stopAlarm();
    }
  }, [orders, isAuthorized]);

  // Clean audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Simulator: simulates inserting a PREPARING order directly to KDS
  const handleSimulateOrder = async () => {
    const nextId = 1000 + orders.length + 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
    
    const mockOrderData = {
      customer_name: ["Doni", "Rian", "Dewi", "Anita"][Math.floor(Math.random() * 4)],
      customer_phone: "08" + Math.floor(Math.random() * 90000000 + 10000000),
      delivery_address: [
        "Kos Puteri Kemuning No.18, Sidorejo Kidul, Salatiga",
        "Perum Argomulyo Blok D-4, Argomulyo, Salatiga",
        "Jl. Patimura No.105, Salatiga"
      ][Math.floor(Math.random() * 4)],
      total_amount: 34000,
      status: "PREPARING" as const,
      items: [
        { name: "Mie Ayam Komplit Sutra", qty: 1, price: 25000, notes: "Kuah dipisah, ekstra sambal" },
        { name: "Es Teh Manis", qty: 2, price: 4000, notes: "Es batu dikit" }
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
      startAlarm();
    } else {
      const { error } = await supabase.from("orders").insert([mockOrderData]);
      if (error) alert("Error simulating order in DB: " + error.message);
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 font-extrabold uppercase tracking-widest text-xs animate-pulse">
          Memverifikasi Otorisasi...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-screen overflow-hidden">
      
      {/* Top Header Controls */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
            <span>Monitor Dapur</span>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Live KDS
            </span>
          </h1>
          
          {/* Mock vs Live Indicator */}
          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isMockMode ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"
          }`}>
            <Database size={12} />
            {isMockMode ? "Simulasi Offline" : "Koneksi Live Supabase"}
          </div>

          {isAlerting && (
            <button 
              onClick={stopAlarm}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs uppercase tracking-widest flex items-center gap-2 animate-bounce"
            >
              <BellRing size={16} /> Matikan Alarm
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSimulateOrder}
            className="bg-gold hover:bg-yellow-500 text-charcoal font-black px-6 py-3 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-yellow-500/10"
          >
            + Simulasi Order Baru
          </button>
        </div>
      </header>

      {/* Main Order View */}
      <div className="flex-1 overflow-x-auto py-8">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
            <span className="text-6xl">🍲</span>
            <p className="text-xl font-bold tracking-wide uppercase">Semua Pesanan Selesai Masak</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start px-2">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="w-[450px] max-h-full flex-shrink-0 bg-zinc-900 rounded-[2rem] border-2 border-zinc-800 flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Order ID</span>
                    <h2 className="text-4xl font-black tracking-tight text-white">#{order.shortId}</h2>
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wider uppercase block">
                      {order.time}
                    </span>
                    <span className="bg-green-500/10 text-green-550 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wider uppercase block border border-green-500/20">
                      APPROVED
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pb-4 border-b border-zinc-800/40 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <span className="text-3xl font-black text-gold leading-none">{item.qty}x</span>
                          <div className="space-y-1.5 flex-1">
                            <span className="text-2xl font-black text-zinc-100 uppercase tracking-tight leading-tight block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-lg font-black text-amber-400 block tracking-wide bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20">
                                NOTES: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery details */}
                  <div className="pt-6 border-t border-zinc-800/80 space-y-3">
                    <div className="text-sm">
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Pelanggan</span>
                      <span className="text-zinc-200 font-black text-base uppercase">{order.customer_name} ({order.customer_phone})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Alamat Pengiriman</span>
                      <span className="text-zinc-300 leading-relaxed font-semibold text-sm">{order.delivery_address}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 border-t border-zinc-800 flex flex-col gap-3 bg-zinc-900/50 rounded-b-[2rem]">
                  <button 
                    onClick={() => handleComplete(order.id)}
                    className="w-full bg-gold hover:bg-yellow-500 text-charcoal font-black py-4 rounded-xl text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    Selesai Masak
                  </button>

                  <button 
                    onClick={() => copyToJeggBoy(order)}
                    className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    {copiedId === order.id ? (
                      <>
                        <Check size={14} className="text-green-500" /> Disalin!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Salin Format Ojol
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sub-footer Credits */}
      <div className="w-full py-4 border-t border-zinc-900 text-center mt-auto shrink-0">
        <p className="text-xs text-zinc-500 tracking-wide font-sans font-medium">
          Incooperate with Myinvoice.Space | Powered by Digipro
        </p>
      </div>
    </div>
  );
}
