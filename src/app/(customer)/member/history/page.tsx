"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowLeft, History, SearchX } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  useEffect(() => {
    const phone = localStorage.getItem("sutra_member_phone");
    const pin = localStorage.getItem("sutra_member_pin");
    if (phone && pin) {
      loadHistory(phone, pin);
    } else {
      window.location.href = "/member";
    }
  }, []);

  const loadHistory = async (phone: string, pin: string) => {
    setLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        // Since mock mode might not have actual order history linked to member_id yet,
        // we will generate a fake history if none exists for visual testing.
        const mockMemberStr = localStorage.getItem(`mock_member_${phone}`);
        if (mockMemberStr) {
          const user = JSON.parse(mockMemberStr);
          if (user.pin !== pin) {
            window.location.href = "/member";
            return;
          }
          
          let history = localStorage.getItem(`mock_history_${user.id}`);
          if (!history) {
            // Generate fake data
            const fakeData = [
              { id: "ord-1", created_at: new Date(Date.now() - 86400000).toISOString(), total_amount: 35000, status: "completed", items: "Mie Ayam Komplit (x1), Es Teh (x1)" },
              { id: "ord-2", created_at: new Date(Date.now() - 86400000 * 5).toISOString(), total_amount: 15000, status: "completed", items: "Pangsit Goreng (x1)" },
            ];
            localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(fakeData));
            setOrders(fakeData);
          } else {
            setOrders(JSON.parse(history));
          }
        }
        setLoading(false);
      }, 500);
      return;
    }

    // DB mode
    const { data: memberData } = await supabase.rpc("verify_member_pin", { p_phone: phone, p_pin: pin });
    if (memberData && memberData.length > 0) {
      const user = memberData[0];
      // Assuming orders table has customer_phone or member_id.
      // For now we will try checking customer_phone
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_phone", phone)
        .order("created_at", { ascending: false });
      
      if (data) setOrders(data);
    } else {
      window.location.href = "/member";
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-gold" />
      </div>
    );
  }

  return (
    <div className="py-12 max-w-md mx-auto px-4 animate-in fade-in duration-300">
      <div className="flex items-center mb-8 gap-4">
        <Link href="/member" className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Riwayat Jajan</h1>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Aktivitas Pemesanan Anda</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-zinc-100 border-dashed flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              <SearchX className="text-zinc-300 w-8 h-8" />
            </div>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          orders.map((order, i) => (
            <div key={order.id || i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-zinc-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm font-bold text-charcoal leading-tight">
                    {order.items ? order.items : `Pesanan #${order.id.toString().substring(0,6).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Selesai</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-zinc-100 pt-3 mt-1 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Belanja</span>
                <span className="text-sm font-black text-gold">Rp {(order.total_amount || 0).toLocaleString("id-ID")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
