import { MapPin, Clock, Phone, Mail, ArrowRight } from "lucide-react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

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
            Nikmati semangkuk mie hangat di area strategis Pusat Kuliner Kridanggo Salatiga, atau pesan pengantaran langsung via kurir ojek online lokal.
          </p>
          <div className="w-20 h-1 bg-gold mt-6"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          {/* Info Column */}
          <div className="space-y-10">
            
            {/* Address */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider text-xs">Alamat Toko</h3>
                <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                  Pusat Kuliner Kridanggo, Salatiga,<br />
                  Kec. Sidorejo, Kota Salatiga,<br />
                  Jawa Tengah 50724
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <Clock size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider text-xs">Jam Operasional</h3>
                <div className="text-zinc-500 text-lg space-y-1 font-medium">
                  <div className="flex gap-4">
                    <span className="font-bold text-charcoal">Selasa – Minggu:</span>
                    <span>09.00 – 22.00 WIB</span>
                  </div>
                  <div className="flex gap-4 text-red-650 font-extrabold uppercase text-xs tracking-widest pt-1">
                    <span>Senin:</span>
                    <span>Tutup (CLOSED)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacts & Socials */}
            <div className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-gold flex-shrink-0">
                <Phone size={24} />
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider text-xs">Informasi Kontak</h3>
                
                <div className="text-zinc-500 space-y-2 text-base font-medium">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-zinc-400" />
                    <span>Email: <a href="mailto:Mieayamsutra88@gmail.com" className="text-charcoal hover:underline">Mieayamsutra88@gmail.com</a></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="text-zinc-400" />
                    <span>Instagram: <a href="https://instagram.com/MieAyamSutra" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:underline">@MieAyamSutra</a></span>
                  </div>
                </div>

                <div className="pt-2">
                  <a 
                    href="https://wa.me/6282225224961?text=Halo%20Mie%20Ayam%20Sutra%2C%20saya%20mau%20tanya%20mengenai%20pesanan%20saya" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-charcoal font-black border-b-2 border-charcoal pb-0.5 hover:text-gold hover:border-gold transition-colors text-sm uppercase tracking-wider"
                  >
                    Hubungi WhatsApp (082225224961) <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Maps Embed - Real Google Maps Iframe */}
          <div className="w-full aspect-square bg-zinc-100 rounded-[2.5rem] overflow-hidden border border-zinc-200/50 shadow-sm relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.786536968032!2d110.49754667587834!3d-7.327743772064115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a79fe0a90c32f%3A0xcc80cbfa9919234f!2sPusat%20Kuliner%20PKL%20Kridanggo!5e0!3m2!1sid!2sid!4v1718198765432!5m2!1sid!2sid"
              className="w-full h-full border-0"
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
