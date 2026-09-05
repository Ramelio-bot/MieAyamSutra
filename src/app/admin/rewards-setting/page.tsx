"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";

interface Reward {
  id: string;
  title: string;
  description: string;
  stamp_cost: number;
  is_active: boolean;
}

export default function RewardsSettingPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stampCost, setStampCost] = useState(5);
  const [isActive, setIsActive] = useState(true);
  
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    if (isMockMode) {
      setTimeout(() => {
        const mockRewards = localStorage.getItem("mock_reward_catalog");
        if (mockRewards) {
          setRewards(JSON.parse(mockRewards));
        } else {
          // Default mock data
          const defaults = [
            { id: "1", title: "1 Porsi Pangsit Goreng", description: "Camilan renyah teman makan mie.", stamp_cost: 5, is_active: true },
            { id: "2", title: "1 Porsi Mie Ayam Ori", description: "Menu andalan kami gratis untuk Anda.", stamp_cost: 10, is_active: true },
            { id: "3", title: "Mie Komplit + Es Teh", description: "Paket kenyang maksimal.", stamp_cost: 15, is_active: true }
          ];
          localStorage.setItem("mock_reward_catalog", JSON.stringify(defaults));
          setRewards(defaults);
        }
        setLoading(false);
      }, 500);
      return;
    }

    const { data } = await supabase.from("reward_catalog").select("*").order("stamp_cost", { ascending: true });
    if (data) setRewards(data);
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingReward(null);
    setTitle("");
    setDescription("");
    setStampCost(5);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setDescription(reward.description || "");
    setStampCost(reward.stamp_cost);
    setIsActive(reward.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Judul Promo wajib diisi");

    const payload = {
      title,
      description,
      stamp_cost: stampCost,
      is_active: isActive
    };

    if (isMockMode) {
      let updated = [...rewards];
      if (editingReward) {
        updated = updated.map(r => r.id === editingReward.id ? { ...r, ...payload } : r);
      } else {
        updated.push({ id: `mock-reward-${Date.now()}`, ...payload });
      }
      localStorage.setItem("mock_reward_catalog", JSON.stringify(updated.sort((a,b) => a.stamp_cost - b.stamp_cost)));
      setRewards(updated.sort((a,b) => a.stamp_cost - b.stamp_cost));
      setIsModalOpen(false);
      return;
    }

    if (editingReward) {
      await supabase.from("reward_catalog").update(payload).eq("id", editingReward.id);
    } else {
      await supabase.from("reward_catalog").insert([payload]);
    }

    setIsModalOpen(false);
    loadRewards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus promo ini secara permanen?")) return;

    if (isMockMode) {
      const updated = rewards.filter(r => r.id !== id);
      localStorage.setItem("mock_reward_catalog", JSON.stringify(updated));
      setRewards(updated);
      return;
    }

    await supabase.from("reward_catalog").delete().eq("id", id);
    loadRewards();
  };

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-gold" /></div>;
  }

  return (
    <div className="py-12 max-w-2xl mx-auto px-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Katalog Reward</h1>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Pengaturan Harga Stamp</p>
          </div>
        </div>
        
        <button 
          onClick={openNewModal}
          className="bg-gold text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md hover:bg-yellow-600 transition-colors"
        >
          <Plus size={16} /> Promo Baru
        </button>
      </div>

      <div className="space-y-4">
        {rewards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-zinc-100 border-dashed">
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Belum ada promo katalog.</p>
          </div>
        ) : (
          rewards.map(reward => (
            <div key={reward.id} className={`bg-white rounded-2xl p-6 shadow-sm border ${reward.is_active ? 'border-zinc-100' : 'border-red-100 opacity-60'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter">{reward.title}</h3>
                  {!reward.is_active && (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Nonaktif</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-medium">{reward.description || "-"}</p>
                <div className="mt-2 text-gold font-black text-sm uppercase tracking-widest">
                  Harga: {reward.stamp_cost} Stamp
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(reward)}
                  className="p-3 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(reward.id)}
                  className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-zinc-150 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-charcoal transition-colors">
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black text-charcoal uppercase tracking-tight mb-6">
              {editingReward ? 'Edit Promo' : 'Promo Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Nama Promo</label>
                <input 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm font-bold text-charcoal focus:outline-none focus:border-gold transition-colors"
                  placeholder="Contoh: 1 Porsi Pangsit"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Deskripsi</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm font-medium text-charcoal focus:outline-none focus:border-gold transition-colors"
                  placeholder="Penjelasan singkat..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Harga Stamp</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    value={stampCost}
                    onChange={(e) => setStampCost(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-sm font-black text-charcoal focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-gold focus:ring-gold"
                    />
                    <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Status Aktif</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full mt-4 bg-charcoal text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold transition-colors shadow-lg">
                <Save size={16} /> Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
