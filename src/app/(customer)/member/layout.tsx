"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, History } from "lucide-react";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are exactly on the member root, or sub-pages that need the bottom nav
  const isAuthPage = pathname === "/member/login" || pathname === "/member/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/member", icon: User },
    { label: "Kupon Saya", href: "/member/rewards", icon: Ticket },
    { label: "Riwayat", href: "/member/history", icon: History },
  ];

  return (
    <div className="pb-24">
      {/* Main Content */}
      <div className="min-h-screen">
        {children}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? "text-gold" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span className={`text-[10px] tracking-wide uppercase font-bold ${isActive ? "font-black" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
