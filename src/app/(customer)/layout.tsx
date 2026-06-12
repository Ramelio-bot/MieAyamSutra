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
          
          {/* Logo Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-black text-charcoal tracking-tight uppercase hover:text-gold transition-colors">
              Mie Ayam <span className="text-gold">Sutra.</span>
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
      
      {/* Footer */}
      <footer className="bg-charcoal text-white/60 py-12 text-center text-sm mt-auto">
        <div className="container mx-auto px-4">
          <p className="font-bold text-white text-lg mb-2">Mie Ayam Sutra.</p>
          <p>Jl. Imam Bonjol No.85, Salatiga</p>
          <p className="mt-8">&copy; {new Date().getFullYear()} Mie Ayam Sutra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
