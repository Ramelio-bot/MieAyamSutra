"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Bell, Database, ShoppingBag } from "lucide-react";
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
  status: "PENDING" | "PREPARING" | "CANCELLED";
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

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

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

  // Sound Synthesizer: Subtle notification chime (Double high-pitch beep)
  const playSubtleChime = () => {
    try {
      if (typeof window === "undefined") return;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const tones = [987.77, 1318.51]; // B5 and E6 (friendly notification)

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

  // Check Supabase URL & Setup Database Connection
  useEffect(() => {
    if (!isAuthorized) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
    
    setIsMockMode(isPlaceholder);

    if (isPlaceholder) {
      setOrders(MOCK_PENDING_ORDERS);
      return;
    }

    // Fetch live pending orders
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setOrders(data.map(mapDbOrderToKdsOrder));
      }
    };

    fetchOrders();

    // Subscribe to realtime updates for PENDING status
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new.status === "PENDING") {
            const newOrder = mapDbOrderToKdsOrder(payload.new);
            setOrders(prev => [newOrder, ...prev]);
            playSubtleChime();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updatedOrder = mapDbOrderToKdsOrder(payload.new);
          if (updatedOrder.status !== "PENDING") {
            // Remove from list if status changed (e.g. accepted/cancelled)
            setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
          } else {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  const handleSimulateOrder = async () => {
    const nextId = 2000 + orders.length + 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
    
    const mockOrderData = {
      customer_name: ["Bayu", "Fandi", "Cynthia", "Lestari"][Math.floor(Math.random() * 4)],
      customer_phone: "08" + Math.floor(Math.random() * 90000000 + 10000000),
      delivery_address: [
        "Jalan Patimura No.45, Salatiga",
        "Kos Pangeran No.2, Sidorejo, Salatiga",
        "Jl. Argoboga No.8, Argomulyo, Salatiga"
      ][Math.floor(Math.random() * 3)],
      total_amount: 39000,
      status: "PENDING" as const,
      items: [
        { name: "Mie Ayam Komplit Sutra", qty: 1, price: 25000, notes: "Ekstra ayam kecap" },
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
      playSubtleChime();
    } else {
      const { error } = await supabase.from("orders").insert([mockOrderData]);
      if (error) alert("Error simulating order in DB: " + error.message);
    }
  };

  const handleConfirm = async (id: string) => {
    if (isMockMode) {
      setOrders(prev => prev.filter(o => o.id !== id));
      alert("Order dikonfirmasi (Simulasi)!");
    } else {
      const { error } = await supabase.from("orders").update({ status: "PREPARING" }).eq("id", id);
      if (error) alert("Gagal mengkonfirmasi orderan: " + error.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (isMockMode) {
      setOrders(prev => prev.filter(o => o.id !== id));
      alert("Order dibatalkan (Simulasi)!");
    } else {
      const { error } = await supabase.from("orders").update({ status: "CANCELLED" }).eq("id", id);
      if (error) alert("Gagal membatalkan orderan: " + error.message);
    }
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

  return (
    <div className="p-6 md:p-8 flex flex-col min-h-screen">
      
      {/* Top Header Controls */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3 text-zinc-900">
            <span>Admin Dashboard</span>
            <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-900" />
              Validasi Order
            </span>
          </h1>
          
          {/* Mock vs Live Indicator */}
          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isMockMode ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            <Database size={12} />
            {isMockMode ? "Simulasi Offline" : "Koneksi Live Supabase"}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={playSubtleChime}
            className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-colors"
            title="Tes Chime Notifikasi"
          >
            <Bell size={20} />
          </button>
          <button 
            onClick={handleSimulateOrder}
            className="bg-charcoal text-white hover:bg-zinc-800 font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-wider transition-all shadow-md"
          >
            + Simulasi Order Masuk
          </button>
        </div>
      </header>

      {/* Main Order View */}
      <div className="flex-1 py-8">
        {orders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 space-y-4">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <p className="text-lg font-bold tracking-wide uppercase">Tidak Ada Antrean Order Baru</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <div className="space-y-1">
                    <span className="text-zinc-400 text-xs uppercase tracking-wider font-extrabold">Order ID</span>
                    <h2 className="text-3xl font-black tracking-tight text-zinc-900">#{order.shortId}</h2>
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className="bg-zinc-200 text-zinc-700 text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wider uppercase block">
                      {order.time}
                    </span>
                    <span className="bg-zinc-900 text-white text-[10px] font-extrabold px-2 py-1 rounded-md tracking-wider uppercase block">
                      PENDING VALIDATION
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 space-y-6">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <span className="text-xl font-bold text-gold">{item.qty}x</span>
                          <div className="space-y-1 flex-1">
                            <span className="text-lg font-bold text-zinc-900 uppercase tracking-tight block">
                              {item.name}
                            </span>
                            {item.notes && (
                              <span className="text-sm font-bold text-zinc-500 block italic">
                                Catatan: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery details */}
                  <div className="pt-6 border-t border-zinc-100 space-y-3 text-sm">
                    <div>
                      <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[10px]">Pelanggan</span>
                      <span className="text-zinc-800 font-extrabold text-base uppercase">{order.customer_name} ({order.customer_phone})</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[10px]">Alamat Pengiriman</span>
                      <span className="text-zinc-600 leading-relaxed font-semibold">{order.delivery_address}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block uppercase tracking-wider text-[10px]">Total Belanja</span>
                      <span className="text-zinc-900 font-extrabold text-lg">{formatRupiah(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 border-t border-zinc-150 flex flex-col sm:flex-row gap-3 bg-zinc-50/50">
                  <button 
                    onClick={() => handleConfirm(order.id)}
                    className="flex-1 bg-charcoal text-white hover:bg-gold hover:text-charcoal font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} /> Konfirmasi Ke Dapur
                  </button>
                  <button 
                    onClick={() => handleCancel(order.id)}
                    className="bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 border border-zinc-200 hover:border-red-200 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
