export const metadata = {
  title: "Monitor Dapur - Mie Ayam Sutra",
  description: "Kitchen Display System (KDS) untuk Mie Ayam Sutra",
};

export default function DapurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 antialiased dapur-mode">
      {children}
    </div>
  );
}
