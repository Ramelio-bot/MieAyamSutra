export const metadata = {
  title: "Kitchen Display - Mie Ayam Sutra",
  description: "Kitchen Display System (KDS) untuk staf dapur.",
};

export default function KDSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full dapur-mode font-pjs antialiased overflow-hidden select-none">
      {children}
    </div>
  );
}
