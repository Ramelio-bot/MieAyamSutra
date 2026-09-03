"use client";

import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/constants";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export default function StickyCartBar() {
  const { getTotalItems, getTotalPrice, openCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="w-full max-w-lg pointer-events-auto">
        <button 
          onClick={openCart}
          className="w-full bg-charcoal text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gold text-charcoal w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
              {totalItems}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Pesanan</span>
              <span className="font-black text-lg leading-none">{formatRupiah(totalPrice)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gold">
            <span className="font-black uppercase tracking-wider text-sm hidden sm:inline">Lihat Keranjang</span>
            <ShoppingBag size={24} />
          </div>
        </button>
      </div>
    </div>
  );
}
