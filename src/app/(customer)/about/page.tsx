import { MapPin, Mail, Clock } from "lucide-react";

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

export default function AboutPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-20 md:py-32 max-w-4xl">
      <div className="space-y-16">
        <header className="space-y-4">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-extrabold">Filosofi & Asal-usul</span>
          <h1 className="text-4xl md:text-7xl font-black text-charcoal leading-none uppercase tracking-tighter">
            Bicara Rasa,<br />
            Bicara Sejarah.
          </h1>
          <div className="w-20 h-1 bg-gold mt-6"></div>
        </header>

        {/* Narrative Section - Premium Editorial style */}
        <section className="space-y-10 text-lg md:text-xl text-zinc-600 font-medium leading-relaxed">
          <p className="first-letter:text-6xl first-letter:font-black first-letter:text-charcoal first-letter:mr-3 first-letter:float-left first-letter:leading-none">
            Karakteristik utama mi kami terletak pada teksturnya yang mikro-halus. Dibuat secara khusus menggunakan tepung gandum pilihan berkekuatan protein tinggi, mi diproses dengan teknik pengulian lambat yang melahirkan kelembutan sutra namun tetap mempertahankan gigitan kenyal (al dente) yang khas.
          </p>

          <p>
            Di Mie Ayam Sutra, kami percaya bahwa mi yang sempurna bukan sekadar tentang rasa bumbu, melainkan harmonisasi sempurna antara keelastisan adonan mi, minyak bumbu gurih yang meresap rata, serta potongan daging ayam segar yang diolah lambat dengan kecap lokal Salatiga pilihan.
          </p>

          <blockquote className="border-l-4 border-gold pl-6 py-3 my-12 italic text-charcoal font-black text-xl md:text-3xl bg-zinc-50 rounded-r-3xl tracking-tight leading-relaxed">
            "Kami mendedikasikan waktu berjam-jam setiap subuh untuk menguleni adonan segar, guna menyajikan sepiring kehangatan otentik bagi pelanggan setia kami di kaki Gunung Merbabu."
          </blockquote>

          <p>
            Salatiga, kota yang kaya akan sejarah dan keberagaman kuliner, menjadi rumah terbaik bagi resep kami tumbuh dan berkembang. Kami berkomitmen untuk terus mempertahankan tradisi mie ayam artisanal ini—sebuah dedikasi penuh rasa yang bebas dari bahan pengawet buatan, dibuat tulus untuk memanjakan lidah para penikmat kuliner sejati.
          </p>
        </section>

        {/* Operational & Location Quick Details */}
        <section className="pt-12 border-t border-zinc-150 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-charcoal uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} className="text-gold" /> Lokasi Baru Kami
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium pl-6">
              Pusat Kuliner Kridanggo, Salatiga,<br />
              Kec. Sidorejo, Kota Salatiga, Jawa Tengah 50724
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-charcoal uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-gold" /> Jam Operasional
            </h3>
            <p className="text-zinc-500 leading-relaxed font-medium pl-6">
              Selasa - Minggu: 09.00 - 22.00 WIB | <span className="text-red-600 font-bold">Senin: TUTUP</span>
            </p>
          </div>
        </section>

        {/* Visual Map - Live Google Maps Embed pointing precisely to Pusat Kuliner Kridanggo */}
        <div className="w-full mt-16 overflow-hidden rounded-[2rem] border border-zinc-200/50 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.786536968032!2d110.49754667587834!3d-7.327743772064115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a79fe0a90c32f%3A0xcc80cbfa9919234f!2sPusat%20Kuliner%20PKL%20Kridanggo!5e0!3m2!1sid!2sid!4v1718198765432!5m2!1sid!2sid"
            className="w-full h-[350px] border-0"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        {/* Brand Contacts */}
        <footer className="pt-12 border-t border-zinc-150 flex flex-wrap gap-8 justify-between text-zinc-500 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-zinc-400" />
            <span>Email: <a href="mailto:Mieayamsutra88@gmail.com" className="text-charcoal hover:underline">Mieayamsutra88@gmail.com</a></span>
          </div>
          <div className="flex items-center gap-2">
            <Instagram className="text-zinc-400" />
            <span>Instagram: <a href="https://instagram.com/MieAyamSutra" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:underline">@MieAyamSutra</a></span>
          </div>
        </footer>
      </div>
    </article>
  );
}
