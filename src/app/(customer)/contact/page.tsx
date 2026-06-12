import { MapPin, Clock, Phone, ArrowRight } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-20 md:py-32">
      <div className="max-w-5xl mx-auto space-y-16">
        <header className="space-y-4 max-w-xl">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-extrabold">Lokasi & Operasional</span>
          <h1 className="text-4xl md:text-7xl font-black text-charcoal uppercase tracking-tighter leading-none">
            Kunjungi Kami.
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed font-medium">
            Menikmati semangkuk mie hangat di sejuknya kota Salatiga, atau hubungi kami langsung untuk pengantaran cepat via JeggBoy.
          </p>
          <div className="w-20 h-1 bg-gold mt-6"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Info Column */}
          <div className="space-y-12">
            
            {/* Address */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-charcoal uppercase tracking-wider text-xs">Alamat Toko</h3>
                <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                  Jalan Imam Bonjol No.85,<br />
                  Kec. Sidorejo, Kota Salatiga,<br />
                  Jawa Tengah 50711
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <Clock size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-charcoal uppercase tracking-wider text-xs">Jam Operasional</h3>
                <div className="text-zinc-500 text-lg space-y-1 font-medium">
                  <div className="flex gap-4">
                    <span className="font-bold text-charcoal">Selasa – Minggu:</span>
                    <span>09.00 – 22.00 WIB</span>
                  </div>
                  <div className="flex gap-4 text-red-600 font-extrabold uppercase text-sm tracking-widest pt-1">
                    <span>Senin:</span>
                    <span>Tutup (Closed)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WA */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <Phone size={24} />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black text-charcoal uppercase tracking-wider text-xs">WhatsApp Hotline</h3>
                <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                  Hubungi kami untuk tanya jawab menu, pesanan khusus, atau katering.
                </p>
                <a 
                  href="https://wa.me/628123456789" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 text-charcoal font-black border-b-2 border-charcoal pb-0.5 hover:text-gold hover:border-gold transition-colors pt-1 text-sm uppercase tracking-wider"
                >
                  Hubungi WhatsApp <ArrowRight size={16} />
                </a>
              </div>
            </div>

          </div>

          {/* Maps Embed Placeholder */}
          <div className="w-full aspect-square bg-zinc-100 rounded-[2.5rem] overflow-hidden border border-zinc-200/50 shadow-sm relative flex items-center justify-center">
            {/* Design Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, #000 10%, transparent 11%)",
              backgroundSize: "20px 20px"
            }} />
            <div className="text-center z-10 space-y-2">
              <MapPin className="text-zinc-400 mx-auto" size={40} />
              <span className="text-zinc-400 font-extrabold uppercase tracking-widest text-xs block">Google Maps Placeholder 🗺️</span>
              <p className="text-zinc-400 text-xs px-12 max-w-sm font-medium">
                Jl. Imam Bonjol No.85, Salatiga
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
