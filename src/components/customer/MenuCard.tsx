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
        {/* Placeholder for Image */}
        <div className="w-full aspect-[4/3] bg-zinc-100 rounded-3xl mb-6 overflow-hidden relative border border-zinc-200/40">
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
             <button onClick={handleAdd} className="bg-white text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
               <Plus size={24} strokeWidth={3} />
             </button>
           </div>
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
          placeholder="Catatan (opsional)" 
          className="flex-1 bg-zinc-100 border border-transparent rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-gold transition-all placeholder:text-zinc-400 font-medium"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button 
          onClick={handleAdd}
          className="bg-charcoal text-white hover:bg-gold px-6 rounded-full font-black text-xs uppercase tracking-widest transition-colors shrink-0"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
