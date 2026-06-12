"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Lock, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getTotalItems, toggleCart } = useCart();
  const totalItems = getTotalItems();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shouldShake, setShouldShake] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenLogin = (route: string) => {
    setSelectedRoute(route);
    setIsDropdownOpen(false);
    setPin("");
    setErrorMsg("");
    setShouldShake(false);
    setIsModalOpen(true);
  };

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "8888") {
      if (typeof window !== "undefined") {
        localStorage.setItem("sutra_staff_token", "8888");
      }
      setIsModalOpen(false);
      router.push(selectedRoute);
    } else {
      setShouldShake(true);
      setErrorMsg("Akses Ditolak. PIN Salah!");
      setTimeout(() => {
        setShouldShake(false);
      }, 500);
    }
  };

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

          {/* Cart & Staff Portal Right */}
          <div className="flex-shrink-0 flex items-center gap-4">
            {/* Staff Portal Button */}
            <button
              onClick={() => handleOpenLogin("/admin")}
              className="p-2 text-charcoal hover:text-gold transition-colors flex items-center justify-center border border-zinc-200 hover:border-zinc-300 rounded-full bg-white shadow-xs"
              title="Portal Operasional Staff"
            >
              <Lock size={18} strokeWidth={2.5} />
            </button>

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
          
          <div className="w-full py-4 mt-8 border-t border-zinc-850 text-center">
            <p className="text-xs text-zinc-500 tracking-wide font-sans font-medium">
              Incooperate with Myinvoice.Space | Powered by Digipro
            </p>
          </div>
        </div>
      </footer>

      {/* Password PIN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-[2rem] max-w-sm w-full p-8 border border-zinc-150 shadow-2xl relative ${shouldShake ? 'animate-shake' : ''}`}>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-charcoal transition-colors p-1"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
                <Lock size={22} />
              </div>
              <h3 className="text-xl font-black text-charcoal uppercase tracking-tight">Verifikasi PIN Staf</h3>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Akses Terbatas ke Pusat Kendali Operasional
              </p>
            </div>

            <form onSubmit={handleSubmitPin} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="••••"
                  className={`w-full text-center text-3xl tracking-[0.5em] font-black py-4 border-b-2 bg-transparent focus:outline-none transition-all ${
                    errorMsg ? "border-red-500 text-red-500 animate-pulse" : "border-zinc-300 focus:border-zinc-900 text-charcoal"
                  }`}
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-center text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse pt-1">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full bg-charcoal hover:bg-gold text-white hover:text-charcoal font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:hover:bg-charcoal disabled:hover:text-white shadow-md"
              >
                Masuk Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
