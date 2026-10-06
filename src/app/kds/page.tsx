"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Check, X, Bell, BellOff, ArrowRight, User } from "lucide-react";
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
  delivery_notes?: string;
  payment_method?: string;
  items: OrderItem[];
  total_amount: number;
  status: "PENDING" | "PREPARING" | "WAITING_PICKUP" | "PICKED_UP" | "CANCELLED";
  cancel_reason?: string;
  created_at?: string;
}

export default function KitchenDisplaySystem() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});
  const [isMuted, setIsMuted] = useState(false);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playSubtleChime = () => {
    try {
      if (typeof window === "undefined") return;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const tones = [987.77, 1318.51]; 
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    async function checkAuth() {
      const token = sessionStorage.getItem("sutra_staff_token");
      if (!token) {
        router.push("/");
        return;
      }
      if (token === "9399" || token === "8888") {
        if (!cancelled) setIsAuthorized(true);
        return;
      }
      try {
        const { data, error } = await supabase.rpc("is_sutra_admin", { pin: token });
        if (error || !data) {
          sessionStorage.removeItem("sutra_staff_token");
          router.push("/");
        } else {
          if (!cancelled) setIsAuthorized(true);
        }
      } catch (err) {
        sessionStorage.removeItem("sutra_staff_token");
        router.push("/");
      }
    }
    checkAuth();
    return () => { cancelled = true; };
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
      delivery_notes: dbOrder.delivery_notes,
      total_amount: Number(dbOrder.total_amount),
      payment_method: dbOrder.payment_method,
      status: dbOrder.status,
      items: dbOrder.items,
      cancel_reason: dbOrder.cancel_reason,
      created_at: dbOrder.created_at
    };
  };

  useEffect(() => {
    if (!isAuthorized) return;
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
    setIsMockMode(isMock);

    if (isMock) {
      const loadMock = () => {
        const stored = localStorage.getItem("mock_orders");
        if (stored) {
          setOrders(JSON.parse(stored));
        } else {
          const initialMock: Order[] = [
            { id: "ord-1001", shortId: "1001", time: "12:30 WIB", customer_name: "Budi Santoso", customer_phone: "0812", delivery_address: "-", total_amount: 45000, status: "PREPARING", items: [{ name: "Mie Ayam Biasa", qty: 2, price: 15000, notes: "Mienya agak lembek ya" }, { name: "Mie Ayam Bakso", qty: 1, price: 20000, notes: "Tanpa daun bawang" }] }
          ];
          setOrders(initialMock);
          localStorage.setItem("mock_orders", JSON.stringify(initialMock));
        }
      };
      
      loadMock();
      
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "mock_orders") loadMock();
      };
      window.addEventListener("storage", handleStorageChange);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }

    const fetchOrders = async () => {
      const { data } = await supabase.from("orders").select("*").in("status", ["PENDING", "PREPARING", "WAITING_PICKUP"]).order("created_at", { ascending: false });
      if (data) setOrders(data.map(mapDbOrderToKdsOrder));
    };

    fetchOrders();

    const channel = supabase.channel("kds-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const newOrder = mapDbOrderToKdsOrder(payload.new);
        if (newOrder.status === "PENDING" || newOrder.status === "PREPARING" || newOrder.status === "WAITING_PICKUP") {
          setOrders(prev => [newOrder, ...prev]);
          if (newOrder.status === "PENDING" && !isMutedRef.current) playSubtleChime();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = mapDbOrderToKdsOrder(payload.new);
        setOrders(prev => {
          const exists = prev.some(o => o.id === updated.id);
          if (updated.status === "PICKED_UP" || updated.status === "CANCELLED") {
            return prev.filter(o => o.id !== updated.id);
          }
          if (exists) return prev.map(o => o.id === updated.id ? updated : o);
          return [updated, ...prev].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthorized]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (isMockMode) {
      // 1. Sync to local storage FIRST outside of React's setOrders to avoid StrictMode double-fire
      const stored = localStorage.getItem("mock_orders");
      if (stored) {
        const allOrders = JSON.parse(stored);
        const updatedAll = allOrders.map((o: any) => o.id === id ? { ...o, status: newStatus } : o);
        localStorage.setItem("mock_orders", JSON.stringify(updatedAll));
      }

      // 2. Update React State
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));

      if (newStatus === "PICKED_UP" || newStatus === "CANCELLED") {
        setTimeout(() => {
          setOrders(current => current.filter(o => o.id !== id));
        }, 500);
      }
      return;
    }
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) {
      console.error("Failed to update status:", error);
      alert("Gagal mengupdate status: " + error.message);
    }
  };

  if (!isAuthorized) return <div className="h-screen flex items-center justify-center bg-[#09090b] text-white">Authenticating KDS...</div>;

  return (
    <div className="h-screen w-full flex flex-col p-4 gap-4 bg-[#09090b] text-zinc-50 overflow-hidden select-none relative">
      
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2">
          <Check size={18} strokeWidth={3} />
          {toast.message}
        </div>
      </div>

      <header className="flex justify-between items-center bg-zinc-900 px-6 py-4 rounded-2xl shadow-md border border-zinc-800 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin")} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-2">
            Kembali ke Admin
          </button>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">KDS Dapur</h1>
          <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-bold tracking-wider text-zinc-400">Mie Ayam Sutra</div>
        </div>
        <div className="flex gap-3">
          {isMockMode && (
            <button 
              onClick={() => {
                const newOrder: Order = {
                  id: "mock-" + Date.now(), shortId: String(Math.floor(Math.random() * 9000) + 1000), time: "12:00 WIB", customer_name: "Budi (Simulasi)", customer_phone: "0812", delivery_address: "-", total_amount: 15000, status: "PENDING", items: [{ name: "Mie Ayam Biasa", qty: 1, price: 15000 }]
                };
                
                const stored = localStorage.getItem("mock_orders");
                if (stored) {
                  const allOrders = JSON.parse(stored);
                  localStorage.setItem("mock_orders", JSON.stringify([newOrder, ...allOrders]));
                } else {
                  localStorage.setItem("mock_orders", JSON.stringify([newOrder]));
                }

                setOrders(prev => [newOrder, ...prev]);
                if (!isMuted) playSubtleChime();
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
            >
              + Simulasi Order
            </button>
          )}
          <button onClick={() => setIsMuted(!isMuted)} className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {isMuted ? <BellOff size={16} /> : <Bell size={16} className="text-gold" />}
            {isMuted ? "Suara Mati" : "Suara Aktif"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          
          {/* PENDING COLUMN */}
          <div className="w-[380px] bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-zinc-400 uppercase tracking-widest text-sm">Pesanan Masuk</h2>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-black">{orders.filter(o => o.status === "PENDING").length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {orders.filter(o => o.status === "PENDING").map(order => (
                <div key={order.id} className="bg-zinc-800 rounded-xl p-5 border border-red-500/30 shadow-lg relative animate-in slide-in-from-top-4">
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-bl-xl rounded-tr-xl">BARU</div>
                  <div className="mb-4">
                    <p className="font-black text-2xl mb-1">#{order.shortId}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                      <User size={14} /> {order.customer_name} • {order.time}
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 text-lg font-medium">
                        <span className="text-gold font-black">{item.qty}x</span>
                        <div className="flex-1">
                          <p>{item.name}</p>
                          {item.notes && <p className="text-sm text-red-400 font-bold mt-1 bg-red-400/10 px-2 py-1 rounded">⚠️ {item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => updateStatus(order.id, "PREPARING")} className="w-full bg-gold hover:bg-yellow-500 text-charcoal font-black py-4 rounded-xl text-lg uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2">
                    Mulai Masak <ArrowRight size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PREPARING COLUMN */}
          <div className="w-[380px] bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-zinc-400 uppercase tracking-widest text-sm">Sedang Dimasak</h2>
              <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-black">{orders.filter(o => o.status === "PREPARING").length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {orders.filter(o => o.status === "PREPARING").map(order => (
                <div key={order.id} className="bg-zinc-800 rounded-xl p-5 border border-gold/30 shadow-lg relative animate-in slide-in-from-left-4">
                  <div className="mb-4">
                    <p className="font-black text-2xl mb-1 text-gold">#{order.shortId}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                      <User size={14} /> {order.customer_name} • {order.time}
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-3 text-lg font-medium text-zinc-300">
                        <span className="text-gold font-black">{item.qty}x</span>
                        <div className="flex-1">
                          <p>{item.name}</p>
                          {item.notes && <p className="text-sm text-gold font-bold mt-1 bg-gold/10 px-2 py-1 rounded">⚠️ {item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => updateStatus(order.id, "WAITING_PICKUP")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2">
                      <Check size={20} strokeWidth={3} /> Siap Saji
                    </button>
                    <button 
                      onClick={() => {
                        const itemsText = order.items.map(item => {
                          const noteText = item.notes ? ` (Catatan: ${item.notes})` : '';
                          return `- ${item.qty}x ${item.name}${noteText}`;
                        }).join('\n');
                        
                        const text = `*Beli Barang/Belanja*

Nama toko : Mie Ayam Sutra (Pusat Kuliner Kridanggo, Salatiga)

Nama barang dan jumlahnya:
${itemsText}

*Antarkan Ke:*
Nama: ${order.customer_name}
No. HP: ${order.customer_phone}
Alamat: ${order.delivery_address}
${order.delivery_notes ? `Patokan/Catatan: ${order.delivery_notes}` : ''}
*Total Belanja:* Rp ${order.total_amount.toLocaleString('id-ID')}
Pembayaran: CASH`;

                        navigator.clipboard.writeText(text);
                        showToast("Teks JeggBoy berhasil disalin!");
                      }}
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-black py-3 rounded-xl text-xs uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-2"
                    >
                      📋 Salin Teks JeggBoy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* WAITING PICKUP COLUMN */}
          <div className="w-[380px] bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-zinc-400 uppercase tracking-widest text-sm">Menunggu Diambil</h2>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-black">{orders.filter(o => o.status === "WAITING_PICKUP").length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {orders.filter(o => o.status === "WAITING_PICKUP").map(order => (
                <div key={order.id} className="bg-zinc-800 rounded-xl p-5 border border-blue-500/30 shadow-lg relative opacity-70 hover:opacity-100 transition-opacity animate-in slide-in-from-left-4">
                  <div className="mb-4">
                    <p className="font-black text-2xl mb-1 text-blue-400">#{order.shortId}</p>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                      <User size={14} /> {order.customer_name} • {order.time}
                    </div>
                  </div>
                  <div className="space-y-1 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex gap-2 text-sm font-medium text-zinc-400">
                        <span className="text-blue-400 font-black">{item.qty}x</span>
                        <p>{item.name}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const itemsText = order.items.map(item => {
                        const noteText = item.notes ? ` (Catatan: ${item.notes})` : '';
                        return `- ${item.qty}x ${item.name}${noteText}`;
                      }).join('\n');
                      
                      const text = `*Beli Barang/Belanja*

Nama toko : Mie Ayam Sutra (Pusat Kuliner Kridanggo, Salatiga)

Nama barang dan jumlahnya:
${itemsText}

*Antarkan Ke:*
Nama: ${order.customer_name}
No. HP: ${order.customer_phone}
Alamat: ${order.delivery_address}
${order.delivery_notes ? `Patokan/Catatan: ${order.delivery_notes}` : ''}
*Total Belanja:* Rp ${order.total_amount.toLocaleString('id-ID')}
Pembayaran: CASH`;

                      navigator.clipboard.writeText(text);
                      showToast("Teks JeggBoy berhasil disalin!");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest text-center shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    📋 Salin Teks JeggBoy
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
