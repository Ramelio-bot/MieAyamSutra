"use client";

import { MOCK_MENUS } from "@/lib/constants";
import MenuCard from "@/components/customer/MenuCard";
import CartSheet from "@/components/customer/CartSheet";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function MenuPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert("Keranjang kosong!");
    
    setIsSubmitting(true);

    const orderData = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      delivery_address: formData.address,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        notes: item.notes || ""
      })),
      total_amount: items.reduce((sum, item) => sum + (item.price * item.qty), 0),
      status: "PENDING"
    };

    try {
      const { error } = await supabase.from("orders").insert([orderData]);

      if (error) {
        alert("Gagal mengirim pesanan: " + error.message);
      } else {
        clearCart();
        setFormData({ name: "", phone: "", address: "" });
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan jaringan: " + err.message);
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
        <div className="mb-20 text-center max-w-xl mx-auto space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-charcoal uppercase tracking-tighter leading-none">Pilihan Menu</h2>
          <p className="text-zinc-500 leading-relaxed font-medium">
            Pilih racikan mi khas kami dan tambahkan instruksi khusus sesuai selera Anda.
          </p>
          <div className="w-16 h-1 bg-gold mx-auto mt-6"></div>
        </div>
        
        {/* High-padding grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {MOCK_MENUS.map(menu => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </div>
      </section>

      {/* Checkout Section */}
      <section className="bg-zinc-50 border-t border-zinc-100 py-24 mt-32">
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isSubmitting}
                />
                <label htmlFor="name" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  Atas Nama
                </label>
              </div>
              
              <div className="relative group">
                <input 
                  required
                  type="tel" 
                  id="phone"
                  className="w-full bg-transparent border-b border-zinc-200 py-3 outline-none focus:border-zinc-900 focus:outline-none transition-colors peer text-lg font-medium text-charcoal placeholder-transparent"
                  placeholder="No. WhatsApp"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  disabled={isSubmitting}
                />
                <label htmlFor="phone" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  No. WhatsApp
                </label>
              </div>
              
              <div className="relative group">
                <textarea 
                  required
                  id="address"
                  rows={2}
                  className="w-full bg-transparent border-b border-zinc-200 py-3 outline-none focus:border-zinc-900 focus:outline-none transition-colors peer text-lg font-medium text-charcoal placeholder-transparent resize-none"
                  placeholder="Alamat Lengkap (Salatiga)"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  disabled={isSubmitting}
                />
                <label htmlFor="address" className="absolute left-0 -top-2 text-xs font-extrabold text-zinc-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-charcoal uppercase tracking-widest">
                  Alamat Lengkap (Salatiga)
                </label>
              </div>

              <div className="pt-4">
                <div className="bg-zinc-50 p-6 rounded-2xl text-zinc-700 text-sm leading-relaxed border border-zinc-100">
                  <span className="font-extrabold text-charcoal block mb-2 tracking-wider uppercase text-xs">Metode Pembayaran: Cash / Talangan Ojek Online Lokal Salatiga</span>
                  <p className="text-zinc-500 font-medium">
                    Sistem 100% menggunakan pembayaran tunai di tempat. Kurir Ojek Online Lokal akan menalangi total belanja Anda dan menagihnya beserta ongkir saat tiba di lokasi.
                  </p>
                </div>
              </div>

              <button 
                type="submit"
                disabled={items.length === 0 || isSubmitting}
                className="w-full bg-charcoal text-white font-black py-5 rounded-full mt-4 hover:bg-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-lg shadow-charcoal/10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : (
                  <span>Konfirmasi Pesanan</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <CartSheet />
    </div>
  );
}
