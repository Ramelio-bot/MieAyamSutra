"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 md:py-28 flex flex-col md:flex-row items-center gap-16 min-h-[calc(100vh-80px)]">
      {/* Left Column: Headline and Storytelling */}
      <div className="flex-1 space-y-10 max-w-2xl">
        {/* Subtle Halal Stamp above Hero Title */}
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-zinc-200/60 shadow-sm text-xs font-bold text-charcoal uppercase tracking-widest">
          <img 
            src="https://lh3.googleusercontent.com/d/1-fkp7ign5lANJnVZfqILxaqijxUCBraI" 
            alt="Halal Badge" 
            className="h-5 w-auto object-contain"
          />
          <span>100% Halal Indonesia</span>
        </div>

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
            &ldquo;Bukan sekadar sajian kuliner, melainkan sebuah dedikasi rasa yang telah melayani masyarakat Salatiga selama dekade demi dekade.&rdquo;
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

      {/* Right Column: Visual Frame featuring our official Logo */}
      <div className="flex-1 w-full aspect-[4/5] md:h-[650px] bg-zinc-950 rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col items-center justify-center border border-zinc-850">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        
        {/* Brand Logo in Hero */}
        <div className="z-20 flex flex-col items-center text-center space-y-6 p-8">
          <img 
            src="https://lh3.googleusercontent.com/d/1T4H6gY6qW3PCsfXdc8cf_PN6Gi3hCXyA" 
            alt="Mie Ayam Sutra Brand Logo" 
            className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-full border-4 border-white/90 shadow-2xl animate-pulse"
          />
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-gold font-extrabold">Mie Ayam Sutra</span>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">100% Halal & Homemade</h3>
          </div>
        </div>

        {/* Minimalist Grid Pattern Background for design polish */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, #fff 10%, transparent 11%)",
          backgroundSize: "20px 20px"
        }} />
      </div>
    </section>
  );
}
