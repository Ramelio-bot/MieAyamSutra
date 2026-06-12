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
        <div className="w-full aspect-[4/3] bg-zinc-100 rounded-3xl mb-6 overflow-hidden relative">
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
             <button onClick={handleAdd} className="bg-white text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
               <Plus size={24} strokeWidth={2.5} />
             </button>
           </div>
        </div>

        <div className="flex justify-between items-start gap-4">
          <h3 className="text-2xl font-bold text-charcoal tracking-tight">{menu.name}</h3>
          <p className="text-gold font-bold text-lg whitespace-nowrap">{formatRupiah(menu.price)}</p>
        </div>
        <p className="text-gray-500 mt-3 leading-relaxed">{menu.description}</p>
      </div>
      
      <div className="mt-8 flex gap-3">
        <input 
          type="text" 
          placeholder="Catatan (opsional)" 
          className="flex-1 bg-zinc-50 border border-transparent rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-gold transition-colors placeholder:text-gray-400"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button 
          onClick={handleAdd}
          className="bg-charcoal text-white hover:bg-gold hover:text-charcoal px-6 rounded-full font-bold transition-colors shrink-0"
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
