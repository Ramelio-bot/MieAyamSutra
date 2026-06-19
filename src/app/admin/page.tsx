"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Bell, BellOff, Database, ShoppingBag, Copy, ArrowLeft, Trash2, ImageIcon, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatRupiah } from "@/lib/constants";
import { useMenu } from "@/hooks/useMenu";

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
  status: "PENDING" | "PREPARING" | "WAITING_PICKUP" | "PICKED_UP" | "CANCELLED";
  cancel_reason?: string;
  created_at?: string;
}

interface DbOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: Order["status"];
  items: OrderItem[];
  cancel_reason?: string;
  delivery_notes?: string;
  created_at: string;
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

const MOCK_HISTORY_ORDERS: Order[] = [
  {
    id: "ord-1002",
    shortId: "1002",
    time: "11:15 WIB",
    customer_name: "Adi Pratama",
    customer_phone: "08129876543",
    delivery_address: "Kost Argomulyo Raya No 5, Salatiga",
    total_amount: 19000,
    status: "PICKED_UP",
    created_at: new Date().toISOString(),
    items: [
      { name: "Mie Ayam Pangsit", qty: 1, price: 19000 }
    ]
  },
  {
    id: "ord-1003",
    shortId: "1003",
    time: "10:45 WIB",
    customer_name: "Siska Amelia",
    customer_phone: "08573216549",
    delivery_address: "Jl. Diponegoro No 12, Salatiga",
    total_amount: 30000,
    status: "CANCELLED",
    created_at: new Date().toISOString(),
    items: [
      { name: "Mie Ayam Biasa", qty: 2, price: 15000 }
    ]
  }
];

export default function CommandCenterPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"monitor" | "pickup" | "laporan" | "kelola">("monitor");
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Rejection modal states
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<"ALL" | "SUCCESS" | "CANCELLED">("ALL");
  
  // Menu Management states
  const { menus, addMenu, toggleAvailability, deleteMenu, resetMenus } = useMenu();
  const [kelolaCategoryFilter, setKelolaCategoryFilter] = useState<string>("ALL");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "Mie Klasik",
    description: "",
    image: ""
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Audio state (One-shot chime controls)
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  // Helper to map DB row to State structure
  const mapDbOrderToKdsOrder = (dbOrder: DbOrder): Order => {
    const date = new Date(dbOrder.created_at);
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} WIB`;
    
    let cancelReasonVal = dbOrder.cancel_reason || "";
    if (!cancelReasonVal && dbOrder.delivery_notes && dbOrder.delivery_notes.startsWith("Alasan Batal: ")) {
      cancelReasonVal = dbOrder.delivery_notes.replace("Alasan Batal: ", "");
    }

    return {
      id: dbOrder.id,
      shortId: dbOrder.id.substring(0, 4).toUpperCase(),
      time: timeStr,
      customer_name: dbOrder.customer_name,
      customer_phone: dbOrder.customer_phone,
      delivery_address: dbOrder.delivery_address,
      total_amount: Number(dbOrder.total_amount),
      status: dbOrder.status,
      items: dbOrder.items,
      cancel_reason: cancelReasonVal,
      created_at: dbOrder.created_at
    };
  };

  // Sound Synthesizer: Soft notification chime (played exactly once on new pending order)
  const playSubtleChime = () => {
    try {
      if (typeof window === "undefined") return;
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const tones = [987.77, 1318.51]; // B5 and E6 (friendly notification chime)

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

  // Check auth state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sutra_staff_token");
      if (token !== "8888") {
        alert("Akses ditolak! Silakan login melalui Portal Staf di halaman utama.");
        router.push("/");
      } else {
        setTimeout(() => {
          setIsAuthorized(true);
        }, 0);
      }
    }
  }, [router]);

  // Load orders & Subscribe to all updates
  useEffect(() => {
    if (!isAuthorized) return;

    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
    
    setTimeout(() => {
      setIsMockMode(isPlaceholder);
      if (isPlaceholder) {
        setOrders([...MOCK_PENDING_ORDERS, ...MOCK_PREPARING_ORDERS]);
        setHistoryOrders(MOCK_HISTORY_ORDERS);
      }
    }, 0);

    if (isPlaceholder) {
      return;
    }

    // Fetch initial active pending, preparing & waiting_pickup orders
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["PENDING", "PREPARING", "WAITING_PICKUP"])
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setOrders((data as unknown as DbOrder[]).map(mapDbOrderToKdsOrder));
      }
    };

    // Fetch initial completed & cancelled orders
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["PICKED_UP", "CANCELLED"])
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setHistoryOrders((data as unknown as DbOrder[]).map(mapDbOrderToKdsOrder));
      }
    };

    fetchOrders();
    fetchHistory();

    // Subscribe to all inserts/updates on 'orders'
    const channel = supabase
      .channel("command-center-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = mapDbOrderToKdsOrder(payload.new as unknown as DbOrder);
          if (newOrder.status === "PENDING" || newOrder.status === "PREPARING" || newOrder.status === "WAITING_PICKUP") {
            setOrders(prev => [newOrder, ...prev]);
            if (newOrder.status === "PENDING" && !isMutedRef.current) {
              playSubtleChime();
            }
          } else if (newOrder.status === "PICKED_UP" || newOrder.status === "CANCELLED") {
            setHistoryOrders(prev => [newOrder, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updatedOrder = mapDbOrderToKdsOrder(payload.new as unknown as DbOrder);
          if (updatedOrder.status === "PENDING" || updatedOrder.status === "PREPARING" || updatedOrder.status === "WAITING_PICKUP") {
            setOrders(prev => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              } else {
                return [updatedOrder, ...prev];
              }
            });
            // If moved back, remove from history
            setHistoryOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
          } else {
            // PICKED_UP or CANCELLED: remove from active and add to history
            setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
            setHistoryOrders(prev => {
              const exists = prev.some(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
              } else {
                return [updatedOrder, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized]);

  // Simulator
  const handleSimulateOrder = async (targetStatus: "PENDING" | "PREPARING" | "WAITING_PICKUP") => {
    const nextId = (targetStatus === "PENDING" ? 2000 : (targetStatus === "PREPARING" ? 1000 : 3000)) + orders.length + 1;
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
      total_amount: targetStatus === "PENDING" ? 36000 : (targetStatus === "PREPARING" ? 43000 : 24000),
      status: targetStatus,
      items: targetStatus === "PENDING" 
        ? [
            { name: "Mie Ayam Ori", qty: 1, price: 15000, notes: "Sayur sawi banyakin" },
            { name: "Mie Ayam Bakso", qty: 1, price: 21000 }
          ]
        : targetStatus === "PREPARING"
        ? [
            { name: "Mie Ayam Komplit", qty: 1, price: 27000, notes: "Kuah dipisah" },
            { name: "Es Jeruk Peras", qty: 1, price: 6000 },
            { name: "Es Teh", qty: 2, price: 5000 }
          ]
        : [
            { name: "Miago Ori", qty: 1, price: 19000, notes: "Ojol langsung gas" },
            { name: "Es Teh", qty: 1, price: 5000 }
          ]
    };

    if (isMockMode) {
      const newOrder: Order = {
        id: `ord-${nextId}`,
        shortId: String(nextId),
        time: timeStr,
        created_at: now.toISOString(),
        ...mockOrderData
      };
      setOrders(prev => [newOrder, ...prev]);
      if (targetStatus === "PENDING" && !isMuted) {
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

  const handleCancel = (id: string) => {
    setRejectingOrderId(id);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!rejectingOrderId) return;
    const reason = cancelReason.trim() || "Tidak ada alasan spesifik";
    const targetOrder = orders.find(o => o.id === rejectingOrderId);

    if (isMockMode) {
      if (targetOrder) {
        const updated = { ...targetOrder, status: "CANCELLED" as const, cancel_reason: reason };
        setOrders(prev => prev.filter(o => o.id !== rejectingOrderId));
        setHistoryOrders(prev => [updated, ...prev]);
      }
    } else {
      const { error } = await supabase.from("orders").update({ status: "CANCELLED", cancel_reason: reason }).eq("id", rejectingOrderId);
      if (error) {
        // Fallback: write to delivery_notes if cancel_reason column doesn't exist
        const fallbackError = await supabase.from("orders").update({ 
          status: "CANCELLED", 
          delivery_notes: `Alasan Batal: ${reason}` 
        }).eq("id", rejectingOrderId);
        if (fallbackError.error) {
          alert("Gagal membatalkan orderan: " + fallbackError.error.message);
        }
      }
    }

    setIsCancelModalOpen(false);
    setRejectingOrderId(null);
  };

  const handleComplete = async (id: string) => {
    const targetOrder = orders.find(o => o.id === id);
    if (isMockMode) {
      if (targetOrder) {
        const updated = { ...targetOrder, status: "WAITING_PICKUP" as const };
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
      }
    } else {
      const { error } = await supabase.from("orders").update({ status: "WAITING_PICKUP" }).eq("id", id);
      if (error) alert("Gagal menyelesaikan pesanan: " + error.message);
    }
  };

  const handleConfirmPickup = async (id: string) => {
    const targetOrder = orders.find(o => o.id === id);
    if (isMockMode) {
      if (targetOrder) {
        const updated = { ...targetOrder, status: "PICKED_UP" as const };
        setOrders(prev => prev.filter(o => o.id !== id));
        setHistoryOrders(prev => [updated, ...prev]);
      }
    } else {
      const { error } = await supabase.from("orders").update({ status: "PICKED_UP" }).eq("id", id);
      if (error) alert("Gagal mengkonfirmasi pickup: " + error.message);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Format file harus berupa gambar (JPG, PNG, dll.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Ukuran gambar maksimal 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setMenuForm(prev => ({ ...prev, image: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name.trim() || !menuForm.price) return;

    const newMenuItem = {
      id: "custom_" + Date.now(),
      name: menuForm.name.trim(),
      price: Number(menuForm.price),
      category: menuForm.category as "Mie Klasik" | "Miago" | "Mie Pedas" | "Rice Bowl & Steak" | "Camilan" | "Minuman",
      description: menuForm.description.trim() || "Menu lezat racikan khas Sutra.",
      image_url: menuForm.image || undefined,
      is_available: true
    };

    addMenu(newMenuItem);
    
    setMenuForm({
      name: "",
      price: "",
      category: "Mie Klasik",
      description: "",
      image: ""
    });
    setImagePreview(null);
    setIsAddMenuOpen(false);
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
Total Belanja (Cash): Rp ${order.total_amount.toLocaleString('id-ID')}

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

  // Monitor calculations
  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const preparingOrders = orders.filter(o => o.status === "PREPARING");

  // Report calculations
  const pickedUpTodayOrders = historyOrders.filter(o => o.status === "PICKED_UP" && isToday(o.created_at));

  const totalOmzet = historyOrders
    .filter(o => o.status === "PICKED_UP")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const totalPorsi = historyOrders
    .filter(o => o.status === "PICKED_UP")
    .reduce((sum, o) => {
      return sum + o.items
        .filter(item => item.name.toLowerCase().includes("mie"))
        .reduce((itemSum, item) => itemSum + item.qty, 0);
    }, 0);

  const totalDibatalkan = historyOrders.filter(o => o.status === "CANCELLED").length;

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
          {/* Mute toggle button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border bg-white ${
              isMuted 
                ? "text-zinc-400 border-zinc-200 hover:text-zinc-600 hover:border-zinc-300" 
                : "text-zinc-700 border-zinc-200 hover:text-gold hover:border-gold"
            }`}
            title={isMuted ? "Suara Chime Dimatikan" : "Suara Chime Aktif"}
          >
            {isMuted ? <BellOff size={14} /> : <Bell size={14} />}
            {isMuted ? "Muted" : "Suara Chime"}
          </button>

          <button 
            onClick={() => handleSimulateOrder("PENDING")}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-zinc-200"
          >
            + Simulasi Pending
          </button>
          <button 
            onClick={() => handleSimulateOrder("PREPARING")}
            className="bg-gold hover:bg-yellow-500 text-charcoal font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            + Simulasi Dapur
          </button>
          <button 
            onClick={() => handleSimulateOrder("WAITING_PICKUP")}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all border border-zinc-200"
          >
            + Simulasi Ready
          </button>
        </div>
      </header>

      {/* Tab bar switch */}
      <div className="flex border-b border-zinc-200 bg-white shrink-0 px-6 overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex-none shrink-0 ${
            activeTab === "monitor"
              ? "border-charcoal text-charcoal"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          Monitor Operasional ({orders.filter(o => o.status === "PENDING" || o.status === "PREPARING").length})
        </button>
        <button
          onClick={() => setActiveTab("pickup")}
          className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex-none shrink-0 ${
            activeTab === "pickup"
              ? "border-charcoal text-charcoal"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          Status Pickup Driver ({orders.filter(o => o.status === "WAITING_PICKUP").length})
        </button>
        <button
          onClick={() => setActiveTab("kelola")}
          className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex-none shrink-0 ${
            activeTab === "kelola"
              ? "border-charcoal text-charcoal"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          KELOLA MENU ({menus.length})
        </button>
        <button
          onClick={() => setActiveTab("laporan")}
          className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex-none shrink-0 ${
            activeTab === "laporan"
              ? "border-charcoal text-charcoal"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          Laporan Penjualan ({historyOrders.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {activeTab === "monitor" ? (
          /* MONITOR TAB: Split screen */
          <div className="h-full flex overflow-hidden">
            
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
              <div className="p-4 px-6 border-b border-zinc-850 flex justify-between items-center bg-zinc-950 shrink-0">
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
        ) : activeTab === "pickup" ? (
          /* STATUS PICKUP DRIVER TAB: Split screen / dual columns */
          <div className="h-full flex overflow-hidden">
            
            {/* LEFT COLUMN: Belum di-Pickup */}
            <section className="w-1/2 bg-zinc-50 border-r border-zinc-200 flex flex-col h-full overflow-hidden">
              <div className="p-4 px-6 border-b border-zinc-200 flex justify-between items-center bg-white shrink-0">
                <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span>Belum di-Pickup</span>
                  <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                    {orders.filter(o => o.status === "WAITING_PICKUP").length}
                  </span>
                </h2>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Menunggu Driver</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {orders.filter(o => o.status === "WAITING_PICKUP").length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                    <span className="text-3xl">🛵</span>
                    <p className="text-xs font-bold tracking-widest uppercase">Tidak ada pesanan siap di-pickup</p>
                  </div>
                ) : (
                  orders.filter(o => o.status === "WAITING_PICKUP").map((order) => (
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
                          onClick={() => handleConfirmPickup(order.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          ✓ Konfirmasi Pickup
                        </button>
                        <button 
                          onClick={() => copyToJeggBoy(order)}
                          className="bg-transparent hover:bg-zinc-100 text-zinc-650 border border-zinc-200 font-bold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                        >
                          {copiedId === order.id ? "Disalin!" : "Format Ojol"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: Sudah di-Pickup */}
            <section className="w-1/2 bg-white flex flex-col h-full overflow-hidden">
              <div className="p-4 px-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/30 shrink-0">
                <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span>Sudah di-Pickup</span>
                  <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                    {pickedUpTodayOrders.length}
                  </span>
                </h2>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Hari Ini</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {pickedUpTodayOrders.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                    <Check className="text-green-500 w-9 h-9" strokeWidth={1.5} />
                    <p className="text-xs font-bold tracking-widest uppercase">Belum ada order diambil hari ini</p>
                  </div>
                ) : (
                  pickedUpTodayOrders.map((order) => (
                    <div 
                      key={order.id}
                      className="bg-green-50/10 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-zinc-900 text-sm">#{order.shortId}</span>
                          <span className="bg-green-50 text-green-700 border border-green-200 text-[8px] px-2 py-0.5 rounded font-extrabold tracking-wide uppercase">
                            DIAMBIL
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {order.customer_name} • {order.time}
                        </p>
                        <p className="text-[10px] text-zinc-400 max-w-[280px] truncate">
                          {order.delivery_address}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="font-extrabold text-zinc-900 text-xs block">
                          {formatRupiah(order.total_amount)}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-semibold block">
                          {order.items.reduce((sum, item) => sum + item.qty, 0)} Porsi
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            
          </div>
        ) : activeTab === "kelola" ? (
          /* KELOLA MENU TAB: Catalog management panel */
          <div className="h-full overflow-y-auto p-8 bg-zinc-50 space-y-6 flex flex-col">
            
            {/* Header section with add button */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-[1.5rem] border border-zinc-200 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-charcoal uppercase tracking-tight">Kelola Katalog Menu</h2>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Total live di customer: {menus.filter(m => m.is_available).length} dari {menus.length} menu
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddMenuOpen(true)}
                  className="bg-charcoal text-white hover:bg-gold hover:text-charcoal font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus size={14} /> Tambah Menu
                </button>
                
                <button
                  onClick={() => {
                    if (confirm("Reset katalog menu ke default awal? Seluruh menu kustom akan terhapus.")) {
                      resetMenus();
                    }
                  }}
                  className="bg-white hover:bg-zinc-50 text-zinc-500 border border-zinc-200 font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  title="Kembalikan Menu Asli"
                >
                  <RefreshCw size={12} /> Reset Default
                </button>
              </div>
            </div>

            {/* Category Filter bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-4 px-6 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mr-2">Filter Kategori:</span>
              {["ALL", "Mie Klasik", "Miago", "Mie Pedas", "Rice Bowl & Steak", "Camilan", "Minuman"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setKelolaCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                    kelolaCategoryFilter === cat
                      ? "bg-charcoal text-white border-charcoal"
                      : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800"
                  }`}
                >
                  {cat === "ALL" ? "Semua" : cat}
                </button>
              ))}
            </div>

            {/* Table/List View */}
            <div className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6 w-16">Foto</th>
                      <th className="py-4 px-6">Nama Menu</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6 text-right">Harga</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {menus.filter(m => kelolaCategoryFilter === "ALL" || m.category === kelolaCategoryFilter).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-zinc-400 font-bold uppercase tracking-widest">
                          Tidak ada menu dalam kategori ini
                        </td>
                      </tr>
                    ) : (
                      menus
                        .filter(m => kelolaCategoryFilter === "ALL" || m.category === kelolaCategoryFilter)
                        .map((menu) => (
                          <tr key={menu.id} className="hover:bg-zinc-50/50 transition-colors">
                            
                            {/* Foto */}
                            <td className="py-4 px-6">
                              {menu.image_url ? (
                                <img 
                                  src={menu.image_url} 
                                  alt={menu.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-zinc-150"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-450 font-bold text-lg">
                                  {menu.category === "Minuman" ? "🍹" : (menu.category === "Camilan" ? "🍟" : "🍲")}
                                </div>
                              )}
                            </td>

                            {/* Nama & Deskripsi */}
                            <td className="py-4 px-6">
                              <span className="font-black text-zinc-950 uppercase tracking-tight block">{menu.name}</span>
                              <span className="text-[10px] text-zinc-400 font-medium block mt-0.5 leading-normal max-w-xs md:max-w-md lg:max-w-lg truncate" title={menu.description}>
                                {menu.description}
                              </span>
                            </td>

                            {/* Kategori */}
                            <td className="py-4 px-6">
                              <span className="bg-zinc-100 text-zinc-650 border border-zinc-200 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                                {menu.category}
                              </span>
                            </td>

                            {/* Harga */}
                            <td className="py-4 px-6 text-right font-extrabold text-zinc-950">
                              {formatRupiah(menu.price)}
                            </td>

                            {/* Status Availability */}
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => toggleAvailability(menu.id)}
                                className={`mx-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors border ${
                                  menu.is_available 
                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {menu.is_available ? "Tersedia" : "Habis"}
                              </button>
                            </td>

                            {/* Aksi Delete */}
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => {
                                  if (confirm(`Hapus menu "${menu.name}"?`)) {
                                    deleteMenu(menu.id);
                                  }
                                }}
                                className="p-2 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors mx-auto block"
                                title="Hapus Menu"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>

                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* LAPORAN TAB: Historical data table and aggregates */
          <div className="h-full overflow-y-auto p-8 bg-zinc-50 space-y-8">
            
            {/* Minimalist Metrics aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-[1.5rem] border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
                <span className="text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider block">
                  Total Omzet Berhasil
                </span>
                <span className="text-3xl font-black text-zinc-950 tracking-tight block mt-3">
                  {formatRupiah(totalOmzet)}
                </span>
                <span className="text-[10.5px] font-bold text-green-600 bg-green-50 border border-green-100 rounded-md py-0.5 px-2 tracking-wide inline-block mt-3 self-start">
                  Dana Talangan Sukses
                </span>
              </div>

              <div className="bg-white rounded-[1.5rem] border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
                <span className="text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider block">
                  Total Porsi Terjual
                </span>
                <span className="text-3xl font-black text-zinc-950 tracking-tight block mt-3">
                  {totalPorsi} Porsi
                </span>
                <span className="text-[10.5px] font-bold text-gold bg-amber-50 border border-amber-100 rounded-md py-0.5 px-2 tracking-wide inline-block mt-3 self-start">
                  Mie Ayam Dimasak
                </span>
              </div>

              <div className="bg-white rounded-[1.5rem] border border-zinc-200 p-6 shadow-xs flex flex-col justify-between">
                <span className="text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider block">
                  Total Order Dibatalkan
                </span>
                <span className="text-3xl font-black text-zinc-950 tracking-tight block mt-3">
                  {totalDibatalkan} Order
                </span>
                <span className="text-[10.5px] font-bold text-red-650 bg-red-50 border border-red-100 rounded-md py-0.5 px-2 tracking-wide inline-block mt-3 self-start">
                  Ditolak / Batal
                </span>
              </div>

            </div>

            {/* History Table list */}
            <div className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-4 px-6 border-b border-zinc-250 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-700 uppercase tracking-widest">Daftar Transaksi Selesai</h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total: {historyOrders.length} Pesanan</span>
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setReportFilter("ALL")}
                    className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-colors border ${
                      reportFilter === "ALL" 
                        ? "bg-charcoal text-white border-charcoal" 
                        : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800"
                    }`}
                  >
                    Semua ({historyOrders.length})
                  </button>
                  <button
                    onClick={() => setReportFilter("SUCCESS")}
                    className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-colors border ${
                      reportFilter === "SUCCESS" 
                        ? "bg-green-600 text-white border-green-600" 
                        : "bg-white text-zinc-500 border-zinc-200 hover:text-green-600"
                    }`}
                  >
                    Sukses ({historyOrders.filter(o => o.status === "PICKED_UP").length})
                  </button>
                  <button
                    onClick={() => setReportFilter("CANCELLED")}
                    className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-colors border ${
                      reportFilter === "CANCELLED" 
                        ? "bg-red-600 text-white border-red-600" 
                        : "bg-white text-zinc-500 border-zinc-200 hover:text-red-600"
                    }`}
                  >
                    Batal ({historyOrders.filter(o => o.status === "CANCELLED").length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Waktu</th>
                      <th className="py-4 px-6">Pelanggan</th>
                      <th className="py-4 px-6">Alamat Antar</th>
                      <th className="py-4 px-6">Menu Pesanan</th>
                      <th className="py-4 px-6 text-right">Total Belanja</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {historyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-zinc-450 font-bold uppercase tracking-widest">
                          Belum Ada Data Transaksi Histori
                        </td>
                      </tr>
                    ) : (
                      historyOrders
                        .filter((order) => {
                          if (reportFilter === "SUCCESS") return order.status === "PICKED_UP";
                          if (reportFilter === "CANCELLED") return order.status === "CANCELLED";
                          return true;
                        })
                        .map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-4 px-6 font-extrabold text-zinc-950">#{order.shortId}</td>
                          <td className="py-4 px-6 text-zinc-500">{order.time}</td>
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-zinc-900 block">{order.customer_name}</span>
                            <span className="text-[10px] text-zinc-400 block">{order.customer_phone}</span>
                          </td>
                          <td className="py-4 px-6 text-zinc-500 max-w-xs truncate" title={order.delivery_address}>
                            {order.delivery_address}
                          </td>
                          <td className="py-4 px-6 text-zinc-650 max-w-xs">
                            <div className="space-y-0.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="truncate">
                                  <span className="font-bold text-gold">{item.qty}x</span> {item.name}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold text-zinc-900">
                            {formatRupiah(order.total_amount)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {order.status === "PICKED_UP" ? (
                              <span className="bg-green-50 text-green-700 border border-green-200 text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                SUKSES
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                  BATAL
                                </span>
                                {order.cancel_reason && (
                                  <span className="text-[10.5px] text-zinc-500 font-medium italic mt-1 block max-w-[155px] truncate" title={order.cancel_reason}>
                                    Alasan: {order.cancel_reason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Slim credits sub-footer */}
      <footer className="py-2.5 border-t border-zinc-200 bg-white text-center text-[10px] text-zinc-400 tracking-wider shrink-0 font-medium font-sans uppercase">
        Incooperate with Myinvoice.Space | Powered by Digipro
      </footer>

      {/* Rejection Reason Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 border border-zinc-150 shadow-2xl relative">
            <button 
              onClick={() => {
                setIsCancelModalOpen(false);
                setRejectingOrderId(null);
              }}
              className="absolute top-6 right-6 text-zinc-400 hover:text-charcoal transition-colors p-1"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <X size={22} />
              </div>
              <h3 className="text-xl font-black text-charcoal uppercase tracking-tight">Tolak Pesanan</h3>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Berikan alasan mengapa pesanan ini ditolak
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <textarea
                  placeholder="Contoh: Stok bahan mie ayam habis, sedang ramai sekali, kurir tidak tersedia, dll."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full min-h-[100px] p-3 text-xs font-semibold border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none transition-all resize-none animate-fade-in"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmCancel}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-md"
                >
                  Tolak Pesanan
                </button>
                <button
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setRejectingOrderId(null);
                  }}
                  className="px-4 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-550 transition-colors uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Menu Modal */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 border border-zinc-150 shadow-2xl relative my-8">
            <button 
              onClick={() => {
                setIsAddMenuOpen(false);
                setImagePreview(null);
                setImageError(null);
              }}
              className="absolute top-6 right-6 text-zinc-400 hover:text-charcoal transition-colors p-1"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-2xl font-black text-charcoal uppercase tracking-tight">Tambah Menu Baru</h3>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Tambahkan hidangan baru ke dalam katalog aktif
              </p>
            </div>

            <form onSubmit={handleAddMenuSubmit} className="space-y-6">
              <div className="space-y-4 text-xs font-bold text-zinc-550 uppercase tracking-wider">
                
                {/* Nama Menu */}
                <div className="space-y-2">
                  <label htmlFor="menu-name" className="block text-[10px]">Nama Menu</label>
                  <input
                    required
                    type="text"
                    id="menu-name"
                    placeholder="Contoh: Mie Ayam Rica-Rica"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 text-xs font-semibold border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none transition-all"
                  />
                </div>

                {/* Harga & Kategori (2 Columns) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="menu-price" className="block text-[10px]">Harga</label>
                    <input
                      required
                      type="number"
                      id="menu-price"
                      min="0"
                      placeholder="Contoh: 18000"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full p-3 text-xs font-semibold border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="menu-category" className="block text-[10px]">Kategori</label>
                    <select
                      id="menu-category"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 text-xs font-semibold border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none bg-white transition-all appearance-none"
                    >
                      <option value="Mie Klasik">Mie Klasik</option>
                      <option value="Miago">Miago</option>
                      <option value="Mie Pedas">Mie Pedas</option>
                      <option value="Rice Bowl & Steak">Rice Bowl & Steak</option>
                      <option value="Camilan">Camilan</option>
                      <option value="Minuman">Minuman</option>
                    </select>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <label htmlFor="menu-desc" className="block text-[10px]">Deskripsi</label>
                  <textarea
                    id="menu-desc"
                    placeholder="Contoh: Mie kenyal dengan siraman bumbu rica-rica pedas gurih ditambah suwiran ayam pedas."
                    value={menuForm.description}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[80px] p-3 text-xs font-semibold border-2 border-zinc-200 focus:border-zinc-950 rounded-xl focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Foto Makanan (Upload preview) */}
                <div className="space-y-2">
                  <label className="block text-[10px]">Foto Makanan</label>
                  <div className="relative border-2 border-dashed border-zinc-250 hover:border-zinc-400 rounded-2xl transition-all p-4 bg-zinc-50/50 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    
                    {imagePreview ? (
                      <div className="relative w-full h-[120px] rounded-xl overflow-hidden group">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider">
                          Ubah Gambar
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 flex flex-col items-center justify-center p-2">
                        <ImageIcon className="text-zinc-400 w-8 h-8" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block">
                          Klik / Tarik Foto Makanan ke Sini
                        </span>
                        <span className="text-[9px] font-medium text-zinc-400 normal-case block">
                          Format JPG/PNG/WEBP, Maksimal 2MB
                        </span>
                      </div>
                    )}
                  </div>
                  {imageError && (
                    <span className="text-[10px] text-red-500 font-extrabold normal-case block mt-1">
                      ⚠️ {imageError}
                    </span>
                  )}
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-charcoal hover:bg-gold text-white hover:text-charcoal font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md"
                >
                  Simpan Menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    setImagePreview(null);
                    setImageError(null);
                  }}
                  className="px-6 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-550 transition-colors uppercase tracking-wider"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
