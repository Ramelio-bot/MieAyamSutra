"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-28 flex flex-col md:flex-row items-center gap-16 min-h-[calc(100vh-80px)]">
      {/* Left Column: Headline and Storytelling */}
      <div className="flex-1 space-y-10 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-black text-charcoal leading-[0.95] tracking-tighter uppercase">
          Mie Halus,<br />
          Lembut, & Tipis<br />
          <span className="text-gold">Tradisi Salatiga.</span>
        </h1>
        
        <div className="space-y-6 text-lg text-zinc-500 leading-relaxed max-w-xl">
          <p>
            Mie Ayam Sutra lahir dari warisan turun-temurun pembuatan mi mikro-halus secara tradisional. Setiap untaian mi ditarik dengan presisi tinggi untuk menghasilkan tekstur lembut luar biasa namun tetap memiliki elastisitas gigitan yang sempurna.
          </p>
          <p className="border-l-4 border-gold pl-6 py-1 italic text-zinc-700 font-medium">
            "Bukan sekadar sajian kuliner, melainkan sebuah dedikasi rasa yang telah melayani masyarakat Salatiga selama dekade demi dekade."
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/menu" 
            className="inline-flex items-center gap-3 bg-charcoal text-white font-black px-10 py-5 rounded-full hover:bg-gold hover:text-white transition-all duration-300 uppercase tracking-widest text-xs shadow-lg shadow-charcoal/10"
          >
            Mulai Pesanan <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Right Column: Visual Frame */}
      <div className="flex-1 w-full aspect-[4/5] md:h-[650px] bg-zinc-100 rounded-[2.5rem] overflow-hidden relative border border-zinc-200/50 shadow-sm flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 to-transparent z-10" />
        
        {/* Placeholder styling to look premium */}
        <div className="text-center z-20 space-y-2 p-8">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-extrabold">Signature Dish</span>
          <h3 className="text-3xl font-black text-charcoal uppercase tracking-tighter">Mie Ayam Komplit Sutra</h3>
        </div>

        {/* Minimalist Grid Pattern Background for design polish */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #000 10%, transparent 11%)",
          backgroundSize: "20px 20px"
        }} />
      </div>
    </section>
  );
}
