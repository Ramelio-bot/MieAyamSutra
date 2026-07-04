"use client";

import { MOCK_MENUS } from "@/lib/constants";
import MenuCard from "@/components/customer/MenuCard";
import CartSheet from "@/components/customer/CartSheet";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useMenu } from "@/hooks/useMenu";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { MenuItem } from "@/types";

export default function MenuPage() {
  const { items, clearCart } = useCart();
  const { menus, setMenus } = useMenu();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });
  
  const [selectedCategory, setSelectedCategory] = useState<string>("Mie Klasik");
  const CATEGORIES = ["Mie Klasik", "Miago", "Mie Pedas", "Rice Bowl & Steak", "Camilan", "Minuman"];

  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    general?: string;
  }>({});

  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  interface Toast {
    message: string;
    type: "success" | "error" | "info";
    id: string;
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Fetch initial menus from database on mount
  useEffect(() => {
    const loadDbMenus = async () => {
      const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true" ||
                         !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                         process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
      if (isMockMode) return;

      try {
        const { data, error } = await supabase
          .from("menus")
          .select("*")
          .order("name", { ascending: true });
        
        if (!error && data && data.length > 0) {
          const mappedMenus = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: Number(item.price),
            image_url: item.image_url || undefined,
            is_available: item.is_available,
            category: item.category as MenuItem['category']
          }));
          setMenus(mappedMenus);
        }
      } catch (err) {
        console.error("Failed to load menus from Supabase, using local instead", err);
      }
    };
    loadDbMenus();
  }, [setMenus]);

  // Check rate limit on mount and run a countdown
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkCooldown = () => {
      const lastOrderTime = localStorage.getItem("last_order_timestamp");
      if (lastOrderTime) {
        const diff = Date.now() - Number(lastOrderTime);
        const remaining = Math.max(0, Math.ceil((60000 - diff) / 1000));
        setCooldownSeconds(remaining);
      }
    };

    checkCooldown();

    const interval = setInterval(() => {
      const lastOrderTime = localStorage.getItem("last_order_timestamp");
      if (lastOrderTime) {
        const diff = Date.now() - Number(lastOrderTime);
        const remaining = Math.max(0, Math.ceil((60000 - diff) / 1000));
        setCooldownSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showSuccessModal]);

  const activeMenus = mounted ? menus : MOCK_MENUS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (items.length === 0) {
      newErrors.general = "Keranjang Anda kosong! Silakan tambahkan menu terlebih dahulu.";
    } else if (totalAmount <= 0) {
      newErrors.general = "Total belanja harus lebih dari Rp 0.";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Nama lengkap harus diisi.";
    }

    const cleanedPhone = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp harus diisi.";
    } else if (cleanedPhone.length < 10) {
      newErrors.phone = "Nomor WhatsApp minimal harus 10 digit angka.";
    } else if (!/^\d+$/.test(cleanedPhone)) {
      newErrors.phone = "Nomor WhatsApp hanya boleh berisi angka.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat pengiriman harus diisi.";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Alamat pengiriman minimal harus 10 karakter.";
    }

    if (cooldownSeconds > 0) {
      newErrors.general = `Harap tunggu ${cooldownSeconds} detik sebelum membuat pesanan baru.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const element = document.getElementById("checkout-form");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    
    setIsSubmitting(true);

    const orderData = {
      customer_name: formData.name.trim(),
      customer_phone: cleanedPhone,
      delivery_address: formData.address.trim(),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        notes: item.notes || ""
      })),
      total_amount: totalAmount,
      status: "PENDING"
    };

    try {
      const { error } = await supabase.from("orders").insert([orderData]);

      if (error) {
        showToast("Gagal mengirim pesanan: " + error.message, "error");
      } else {
        clearCart();
        setFormData({ name: "", phone: "", address: "" });
        localStorage.setItem("last_order_timestamp", Date.now().toString());
        setCooldownSeconds(60);
        showToast("Pesanan berhasil dikirim!", "success");
        setShowSuccessModal(true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast("Terjadi kesalahan jaringan: " + errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to home after 3 seconds when success modal is shown
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, router]);

  // Auto-scroll to form if URL contains #checkout-form hash
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#checkout-form") {
      const timer = setTimeout(() => {
        const element = document.getElementById("checkout-form");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="py-16 md:py-24 relative">
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 backdrop-blur-md transition-opacity">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-4 transform scale-100 transition-transform duration-300 border border-zinc-100 flex flex-col items-center gap-6">
            <CheckCircle2 className="text-green-500 w-20 h-20 animate-bounce" strokeWidth={1.5} />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Pesanan Berhasil Dikirim!</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                Driver Ojol Lokal akan segera menghubungi Anda. Halaman ini akan dialihkan secara otomatis...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Section */}
      <section className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center max-w-xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-charcoal uppercase tracking-tighter leading-none">Pilihan Menu</h2>
          <p className="text-zinc-500 leading-relaxed font-medium">
            Pilih racikan menu khas kami dan nikmati kelezatan rasa selembut sutra.
          </p>
          <div className="w-16 h-1 bg-gold mx-auto mt-4"></div>
        </div>

        {/* Category Tabs Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-20 max-w-4xl mx-auto">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
                selectedCategory === category
                  ? "bg-charcoal text-white border-charcoal shadow-md scale-[1.03]"
                  : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-900 hover:border-zinc-350"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* High-padding grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {activeMenus.filter(menu => menu.category === selectedCategory).map(menu => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </div>
      </section>

      {/* Checkout Section */}
      <section id="checkout-form" className="bg-zinc-50 border-t border-zinc-100 py-24 mt-32">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <div className="bg-white p-8 md:p-16 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.01)] border border-zinc-200/40">
            <div className="text-center mb-16 space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-charcoal tracking-tighter uppercase leading-none">Detail Pengiriman</h2>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Formulir pemesanan langsung via kurir Ojol</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Premium Line-border Style Inputs */}
              <div className="relative group">
                <input 
                  required
                  type="text" 
                  id="name"
                  className="w-full bg-transparent border-b border-zinc-200 py-3 outline-none focus:border-zinc-900 focus:outline-none transition-colors peer text-lg font-medium text-charcoal placeholder-transparent"
                  placeholder="Atas Nama"
                  value={formData.name}
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: undefined});
                  }}
                  disabled={isSubmitting}
                />
                <label htmlFor="name" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  Atas Nama
                </label>
                {errors.name && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 uppercase tracking-wide">{errors.name}</p>
                )}
              </div>
              
              <div className="relative group">
                <input 
                  required
                  type="tel" 
                  id="phone"
                  className="w-full bg-transparent border-b border-zinc-200 py-3 outline-none focus:border-zinc-900 focus:outline-none transition-colors peer text-lg font-medium text-charcoal placeholder-transparent"
                  placeholder="No. WhatsApp"
                  value={formData.phone}
                  onChange={e => {
                    setFormData({...formData, phone: e.target.value});
                    if (errors.phone) setErrors({...errors, phone: undefined});
                  }}
                  disabled={isSubmitting}
                />
                <label htmlFor="phone" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  No. WhatsApp
                </label>
                {errors.phone && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 uppercase tracking-wide">{errors.phone}</p>
                )}
              </div>
              
              <div className="relative group">
                <textarea 
                  required
                  id="address"
                  rows={2}
                  className="w-full bg-transparent border-b border-zinc-200 py-3 outline-none focus:border-zinc-900 focus:outline-none transition-colors peer text-lg font-medium text-charcoal placeholder-transparent resize-none"
                  placeholder="Alamat Lengkap (Salatiga)"
                  value={formData.address}
                  onChange={e => {
                    setFormData({...formData, address: e.target.value});
                    if (errors.address) setErrors({...errors, address: undefined});
                  }}
                  disabled={isSubmitting}
                />
                <label htmlFor="address" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  Alamat Lengkap (Salatiga)
                </label>
                {errors.address && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 uppercase tracking-wide">{errors.address}</p>
                )}
              </div>

              <div className="pt-4">
                <div className="bg-zinc-50 p-6 rounded-2xl text-zinc-700 text-sm leading-relaxed border border-zinc-100">
                  <span className="font-extrabold text-charcoal block mb-2 tracking-wider uppercase text-xs">Metode Pembayaran: Cash / Talangan Ojek Online Lokal Salatiga</span>
                  <p className="text-zinc-500 font-medium">
                    Sistem 100% menggunakan pembayaran tunai di tempat. Kurir Ojek Online Lokal akan menalangi total belanja Anda dan menagihnya beserta ongkir saat tiba di lokasi.
                  </p>
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
                  <span>⚠️</span>
                  <span>{errors.general}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={items.length === 0 || isSubmitting || cooldownSeconds > 0}
                className="w-full bg-charcoal text-white font-black py-5 rounded-full mt-4 hover:bg-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-lg shadow-charcoal/10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : cooldownSeconds > 0 ? (
                  <span>Tunggu ({cooldownSeconds}s)</span>
                ) : (
                  <span>Konfirmasi Pesanan</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <CartSheet />

      {/* Toasts Container */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl border text-xs font-bold uppercase tracking-wide flex items-center justify-between pointer-events-auto transition-all duration-300 transform translate-y-0 scale-100 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                : toast.type === "error"
                ? "bg-red-50 text-red-800 border-red-100"
                : "bg-zinc-50 text-zinc-800 border-zinc-200"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-4 text-zinc-400 hover:text-zinc-650 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
