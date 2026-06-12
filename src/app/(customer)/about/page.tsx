export default function AboutPage() {
  return (
    <article className="container mx-auto px-4 lg:px-8 py-20 md:py-32 max-w-4xl">
      <div className="space-y-12">
        <header className="space-y-4">
          <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Filosofi & Asal-usul</span>
          <h1 className="text-4xl md:text-7xl font-black text-charcoal leading-none uppercase tracking-tight">
            Bicara Rasa,<br />
            Bicara Sejarah.
          </h1>
          <div className="w-20 h-0.5 bg-gold mt-6"></div>
        </header>

        {/* Narrative Section - Premium Editorial style */}
        <section className="space-y-10 text-lg md:text-xl text-zinc-600 font-normal leading-relaxed">
          <p className="first-letter:text-5xl first-letter:font-black first-letter:text-charcoal first-letter:mr-3 first-letter:float-left">
            Karakteristik utama mi kami terletak pada teksturnya yang mikro-halus. Dibuat secara khusus menggunakan tepung gandum pilihan berkekuatan protein tinggi, mi diproses dengan teknik pengulian lambat yang melahirkan kelembutan sutra namun tetap mempertahankan gigitan kenyal (al dente) yang khas.
          </p>

          <p>
            Di Mie Ayam Sutra, kami percaya bahwa mi yang sempurna bukan sekadar tentang rasa bumbu, melainkan harmonisasi sempurna antara keelastisan adonan mi, minyak bumbu gurih yang meresap rata, serta potongan daging ayam segar yang diolah lambat dengan kecap lokal Salatiga pilihan.
          </p>

          <blockquote className="border-l-4 border-gold pl-6 py-2 my-10 italic text-charcoal font-medium text-xl md:text-2xl bg-zinc-50 rounded-r-2xl">
            "Kami mendedikasikan waktu berjam-jam setiap subuh untuk menguleni adonan segar, guna menyajikan sepiring kehangatan otentik bagi pelanggan setia kami di kaki Gunung Merbabu."
          </blockquote>

          <p>
            Salatiga, kota yang kaya akan sejarah dan keberagaman kuliner, menjadi rumah terbaik bagi resep kami tumbuh dan berkembang. Kami berkomitmen untuk terus mempertahankan tradisi mie ayam artisanal ini—sebuah dedikasi penuh rasa yang bebas dari bahan pengawet buatan, dibuat tulus untuk memanjakan lidah para penikmat kuliner sejati.
          </p>
        </section>

        {/* Visual Section */}
        <div className="w-full aspect-[21/9] bg-zinc-100 rounded-[2rem] border border-zinc-200/50 shadow-sm mt-16 overflow-hidden flex items-center justify-center">
          <span className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Artisanal Noodle Kitchen 📸</span>
        </div>
      </div>
    </article>
  );
}
