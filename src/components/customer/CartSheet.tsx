"use client";

import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/constants";
import { ShoppingBag, Trash2, X } from "lucide-react";

export default function CartSheet() {
  const { items, getTotalItems, getTotalPrice, updateQty, removeFromCart, isCartOpen, closeCart } = useCart();
  const totalItems = getTotalItems();

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-charcoal/60 z-[100] backdrop-blur-sm transition-opacity" 
          onClick={closeCart}
        />
      )}
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[110] transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-charcoal" size={24} />
            <h2 className="text-xl font-black text-charcoal uppercase tracking-tight">Keranjang</h2>
            <span className="bg-charcoal text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-charcoal hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="text-lg">Keranjang masih kosong.</p>
              <button 
                onClick={closeCart}
                className="mt-4 border-b-2 border-charcoal text-charcoal font-bold pb-1 hover:text-gold hover:border-gold transition-colors"
              >
                Lihat Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 items-start pb-6 border-b border-gray-100 last:border-0">
                {/* Visual placeholder for Cart Item Image */}
                <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex-shrink-0" />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-charcoal leading-tight">{item.name}</h4>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <p className="text-gold font-bold text-sm mt-1">{formatRupiah(item.price)}</p>
                  
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-2 bg-zinc-50 p-2 rounded-lg break-words italic">"{item.notes}"</p>
                  )}

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center bg-zinc-100 rounded-full">
                      <button 
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal hover:text-gold font-bold transition-colors"
                      >-</button>
                      <span className="w-4 text-center text-sm font-bold text-charcoal">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-charcoal hover:text-gold font-bold transition-colors"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-zinc-50">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-sm">Total</span>
              <span className="text-2xl font-black text-charcoal">{formatRupiah(getTotalPrice())}</span>
            </div>
            <a 
              href="#checkout" 
              onClick={closeCart} 
              className="w-full flex items-center justify-center bg-charcoal text-white py-4 rounded-full font-bold hover:bg-gold hover:text-charcoal transition-colors uppercase tracking-widest text-sm"
            >
              Checkout
            </a>
          </div>
        )}
      </div>
    </>
  );
}
