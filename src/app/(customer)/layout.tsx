"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-offwhite flex flex-col justify-between">
      {/* Header / Navbar Ala Crav Burgers */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8 py-5 flex items-center justify-between">
          
          {/* Logo Left with Brand Image */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-black text-charcoal tracking-tight uppercase hover:text-gold transition-colors flex items-center gap-3">
              <img 
                src="https://lh3.googleusercontent.com/d/1T4H6gY6qW3PCsfXdc8cf_PN6Gi3hCXyA" 
                alt="Mie Ayam Sutra Logo" 
                className="h-10 w-10 object-cover rounded-full border border-zinc-200"
              />
              <span className="hidden sm:inline">
                Mie Ayam <span className="text-gold">Sutra.</span>
              </span>
            </Link>
          </div>

          {/* Nav Center */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-charcoal/80">
            <Link href="/" className="hover:text-gold transition-colors">BERANDA</Link>
            <Link href="/menu" className="hover:text-gold transition-colors">PILIHAN MENU</Link>
            <Link href="/about" className="hover:text-gold transition-colors">SEJARAH & RASA</Link>
            <Link href="/contact" className="hover:text-gold transition-colors">LOKASI & KONTAK</Link>
          </nav>

          {/* Cart Right */}
          <div className="flex-shrink-0 flex items-center">
            <button 
              onClick={toggleCart}
              className="relative p-2 text-charcoal hover:text-gold transition-colors flex items-center gap-2"
            >
              <ShoppingBag size={24} strokeWidth={2} />
              <span className="font-bold text-lg hidden sm:block">Cart</span>
              
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 sm:right-10 translate-x-1/2 -translate-y-1/4 bg-gold text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer with trust badges */}
      <footer className="bg-charcoal text-white/60 py-16 text-center text-sm mt-auto border-t border-zinc-800">
        <div className="container mx-auto px-4 flex flex-col items-center gap-8">
          
          {/* Trust Logos (Halal and brand logo) */}
          <div className="flex items-center justify-center gap-6">
            <img 
              src="https://lh3.googleusercontent.com/d/1T4H6gY6qW3PCsfXdc8cf_PN6Gi3hCXyA" 
              alt="Mie Ayam Sutra Logo" 
              className="h-12 w-12 object-cover rounded-full bg-white p-0.5 border border-zinc-700"
            />
            <img 
              src="https://lh3.googleusercontent.com/d/1-fkp7ign5lANJnVZfqILxaqijxUCBraI" 
              alt="Logo Halal Indonesia" 
              className="h-12 w-auto object-contain bg-white rounded-xl p-2 border border-zinc-700"
            />
          </div>

          <div className="max-w-md space-y-2">
            <p className="font-black text-white text-xl uppercase tracking-wider">Mie Ayam Sutra.</p>
            <p className="font-medium text-zinc-400">Pusat Kuliner Kridanggo, Salatiga, Kec. Sidorejo, Kota Salatiga, Jawa Tengah 50724</p>
            <p className="text-[11px] text-gold font-extrabold tracking-widest uppercase pt-2">100% Halal & Toyyiban • Higienis Terjamin</p>
          </div>
          
          <p className="mt-4 text-xs text-zinc-500">&copy; {new Date().getFullYear()} Mie Ayam Sutra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
