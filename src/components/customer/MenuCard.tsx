"use client";

import { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/constants";
import { Plus, Minus } from "lucide-react";

export default function MenuCard({ menu }: { menu: MenuItem }) {
  const { addToCart, updateQty, removeFromCart, items, isStoreOpen } = useCart();
  const [notes, setNotes] = useState("");

  const cartItem = items.find(item => item.id === menu.id);
  const qty = cartItem ? cartItem.qty : 0;

  const handleAdd = () => {
    addToCart(menu, 1, notes);
    setNotes(""); // reset notes after adding
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQty(menu.id, qty + 1);
    } else {
      handleAdd();
    }
  };

  const handleDecrease = () => {
    if (qty > 1) {
      updateQty(menu.id, qty - 1);
    } else if (qty === 1) {
      removeFromCart(menu.id);
    }
  };

  return (
    <div className="group flex flex-col justify-between transition-all duration-300">
      <div>
        {/* Placeholder for Image / Real Photo */}
        <div className="w-full aspect-[4/3] bg-warm-soft rounded-3xl mb-6 overflow-hidden relative shadow-sm border border-black/5">
           {menu.image_url ? (
             <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-300 font-bold text-4xl">
               {menu.category === "Minuman" ? "🍹" : (menu.category === "Camilan" ? "🍟" : "🍲")}
             </div>
           )}

           {menu.discount_price && menu.is_available && (
             <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-lg z-10 flex flex-col items-center justify-center">
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Diskon</span>
               <span className="font-black leading-tight mt-0.5">{Math.round((1 - (menu.discount_price / menu.price)) * 100)}%</span>
             </div>
           )}

           {menu.is_available && isStoreOpen && qty === 0 && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 z-20">
               <button onClick={handleAdd} className="bg-white text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
                 <Plus size={24} strokeWidth={3} />
               </button>
             </div>
           )}
           {!menu.is_available && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px] z-20">
               <span className="text-white font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-white rounded-xl">
                 Habis
               </span>
             </div>
           )}
        </div>

        <div className="flex justify-between items-start gap-4">
          <h3 className="text-2xl font-black text-charcoal tracking-tighter uppercase leading-tight">{menu.name}</h3>
          <div className="text-right flex-shrink-0">
            {menu.discount_price ? (
              <>
                <p className="text-zinc-400 font-bold text-xs line-through">{formatRupiah(menu.price)}</p>
                <p className="text-red-600 font-black text-xl tracking-tight">{formatRupiah(menu.discount_price)}</p>
              </>
            ) : (
              <p className="text-gold font-black text-xl tracking-tight">{formatRupiah(menu.price)}</p>
            )}
          </div>
        </div>
        <p className="text-zinc-500 mt-3 leading-relaxed text-sm font-medium">{menu.description}</p>
      </div>
      
      <div className="mt-8 flex gap-3 h-[44px]">
        {qty === 0 ? (
          <>
            <input 
              type="text" 
              placeholder={menu.is_available && isStoreOpen ? "Catatan (opsional)" : (isStoreOpen ? "Habis" : "Tutup")} 
              className="flex-1 bg-zinc-100 border border-transparent rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-gold transition-all placeholder:text-zinc-400 font-medium disabled:opacity-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!menu.is_available || !isStoreOpen}
            />
            <button 
              onClick={handleAdd}
              disabled={!menu.is_available || !isStoreOpen}
              className={`px-6 rounded-full font-black text-xs uppercase tracking-widest transition-colors shrink-0 ${
                menu.is_available && isStoreOpen
                  ? "bg-charcoal text-white hover:bg-gold" 
                  : "bg-zinc-200 text-zinc-450 cursor-not-allowed"
              }`}
            >
              {isStoreOpen ? (menu.is_available ? "+ Tambah" : "Habis") : "Tutup"}
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between bg-charcoal rounded-full p-1 shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <button 
              onClick={handleDecrease}
              className="w-10 h-10 flex items-center justify-center text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="font-black text-lg text-white w-12 text-center">
              {qty}
            </span>
            <button 
              onClick={handleIncrease}
              disabled={!isStoreOpen}
              className={`w-10 h-10 flex items-center justify-center text-white rounded-full transition-colors ${
                isStoreOpen ? "bg-gold hover:bg-yellow-500" : "bg-zinc-600 cursor-not-allowed opacity-50"
              }`}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
