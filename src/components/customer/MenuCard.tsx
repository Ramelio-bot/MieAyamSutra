"use client";

import { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/constants";
import { Plus } from "lucide-react";

export default function MenuCard({ menu }: { menu: MenuItem }) {
  const addToCart = useCart(state => state.addToCart);
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    addToCart(menu, 1, notes);
    setNotes(""); // reset notes after adding
  };

  return (
    <div className="group flex flex-col justify-between transition-all duration-300">
      <div>
        {/* Placeholder for Image / Real Photo */}
        <div className="w-full aspect-[4/3] bg-zinc-100 rounded-3xl mb-6 overflow-hidden relative border border-zinc-200/40">
           {menu.image_url ? (
             <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-300 font-bold text-4xl">
               {menu.category === "Minuman" ? "🍹" : (menu.category === "Camilan" ? "🍟" : "🍲")}
             </div>
           )}
           {menu.is_available && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
               <button onClick={handleAdd} className="bg-white text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
                 <Plus size={24} strokeWidth={3} />
               </button>
             </div>
           )}
           {!menu.is_available && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
               <span className="text-white font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-white rounded-xl">
                 Habis
               </span>
             </div>
           )}
        </div>

        <div className="flex justify-between items-start gap-4">
          <h3 className="text-2xl font-black text-charcoal tracking-tighter uppercase leading-tight">{menu.name}</h3>
          <p className="text-gold font-black text-xl whitespace-nowrap tracking-tight">{formatRupiah(menu.price)}</p>
        </div>
        <p className="text-zinc-500 mt-3 leading-relaxed text-sm font-medium">{menu.description}</p>
      </div>
      
      <div className="mt-8 flex gap-3">
        <input 
          type="text" 
          placeholder={menu.is_available ? "Catatan (opsional)" : "Habis"} 
          className="flex-1 bg-zinc-100 border border-transparent rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-gold transition-all placeholder:text-zinc-400 font-medium disabled:opacity-50"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!menu.is_available}
        />
        <button 
          onClick={handleAdd}
          disabled={!menu.is_available}
          className={`px-6 rounded-full font-black text-xs uppercase tracking-widest transition-colors shrink-0 ${
            menu.is_available 
              ? "bg-charcoal text-white hover:bg-gold" 
              : "bg-zinc-200 text-zinc-450 cursor-not-allowed"
          }`}
        >
          {menu.is_available ? "Tambah" : "Habis"}
        </button>
      </div>
    </div>
  );
}
