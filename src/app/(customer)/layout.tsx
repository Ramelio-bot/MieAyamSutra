"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Lock, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getTotalItems, toggleCart, isStoreOpen, closedMessage } = useCart();
  const totalItems = getTotalItems();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Unified Session State
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [userName, setUserName] = useState<string>("");
  
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

  // Restore Unified Session
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function restore() {
      const adminToken = sessionStorage.getItem("sutra_staff_token");
      const memberPhone = localStorage.getItem("sutra_member_phone");
      const memberPin = localStorage.getItem("sutra_member_pin");
      const pathname = window.location.pathname || "";

      // 1. Check Admin Session
      if (adminToken) {
        setUserRole("admin");
        setUserName("Staf Admin");
        if (!cancelled) setCheckingSession(false);
        return;
      }

      // 2. Check Member Session
      if (memberPhone && memberPin) {
        setUserRole("member");
        const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
        
        if (isMockMode) {
          const mockStr = localStorage.getItem(`mock_member_${memberPhone}`);
          if (mockStr) {
            setUserName(JSON.parse(mockStr).name.split(" ")[0]);
          } else {
            setUserName("Member");
          }
          if (!cancelled) setCheckingSession(false);
          return;
        }

        try {
          const { data } = await supabase.rpc("verify_member_pin", { p_phone: memberPhone, p_pin: memberPin });
          if (data && data.length > 0) {
            setUserName(data[0].name.split(" ")[0]);
          } else {
            localStorage.removeItem("sutra_member_phone");
            localStorage.removeItem("sutra_member_pin");
          }
        } catch {}
        
        setUserRole("member");
        if (!cancelled) setCheckingSession(false);
        return;
      }

      // 3. No Session
      setUserRole(null);
      if (pathname.startsWith("/admin") || pathname.startsWith("/dapur")) {
        router.replace("/");
      }
      if (!cancelled) setCheckingSession(false);
    }

    restore();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch Store Status
  useEffect(() => {
    const fetchStatus = async () => {
      const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");
      if (isMockMode) {
        const status = localStorage.getItem("mock_store_status");
        if (status) {
          const parsed = JSON.parse(status);
          useCart.getState().setStoreStatus(parsed.is_open, parsed.closed_message);
        } else {
          useCart.getState().setStoreStatus(true, "Maaf, kedai sedang tutup.");
        }
        return;
      }

      const { data } = await supabase.from("store_settings").select("*").eq("id", 1).single();
      if (data) {
        useCart.getState().setStoreStatus(data.is_open, data.closed_message);
      }
    };
    fetchStatus();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("sutra_staff_token");
    localStorage.removeItem("sutra_member_phone");
    localStorage.removeItem("sutra_member_pin");
    setUserRole(null);
    setIsDropdownOpen(false);
    router.push("/");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col justify-between">
        <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="container mx-auto px-4 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-black text-charcoal tracking-tight uppercase hover:text-gold transition-colors flex items-center gap-3">
                Mie Ayam <span className="text-gold">Sutra.</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1" />
        <footer className="bg-charcoal text-white/60 py-16 text-center text-sm mt-auto border-t border-zinc-800">
          <div className="container mx-auto px-4 flex flex-col items-center gap-8">
            <p className="mt-4 text-xs text-zinc-500 tracking-wide font-sans font-medium">
              Incooperate with Myinvoice.Space | Powered by Digipro
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col justify-between">
      {!isStoreOpen && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-bold uppercase tracking-widest z-50">
          {closedMessage}
        </div>
      )}
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
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4">
            
            {/* Unified Login Portal */}
            <div className="relative" ref={dropdownRef}>
              {userRole ? (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="px-4 py-2 text-charcoal hover:text-gold transition-colors flex items-center justify-center border border-zinc-200 hover:border-zinc-300 rounded-full bg-white shadow-xs gap-2"
                >
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-black">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                    {userName}
                  </span>
                </button>
              ) : (
                <Link
                  href="/member"
                  className="px-4 py-2 text-white bg-charcoal hover:bg-zinc-800 transition-colors flex items-center justify-center rounded-full shadow-xs gap-2"
                >
                  <Lock size={14} strokeWidth={2.5} />
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                    Masuk / Daftar
                  </span>
                </Link>
              )}

              {/* Profile Dropdown */}
              {isDropdownOpen && userRole && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-zinc-50 bg-zinc-50/50">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Halo,</p>
                    <p className="font-black text-charcoal truncate">{userName}</p>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    {userRole === "admin" ? (
                      <>
                        <Link href="/admin" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors">Dashboard Admin</Link>
                        <Link href="/kds" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors flex justify-between items-center">
                          Layar Dapur (KDS)
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        </Link>
                        <Link href="/admin/scan" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors">Kasir Scanner</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/member" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors">Kartu Stamp Saya</Link>
                        <Link href="/member/rewards" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors">Kupon & Reward</Link>
                        <Link href="/member/history" onClick={() => setIsDropdownOpen(false)} className="px-4 py-2 text-xs font-bold text-charcoal hover:bg-zinc-50 rounded-lg transition-colors">Riwayat Pesanan</Link>
                      </>
                    )}
                    <div className="h-px bg-zinc-100 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">Keluar</button>
                  </div>
                </div>
              )}
            </div>

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

    </div>
  );
}
