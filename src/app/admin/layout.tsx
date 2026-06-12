export const metadata = {
  title: "Dashboard Admin - Mie Ayam Sutra",
  description: "Centralized Admin Dashboard untuk Mie Ayam Sutra",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 antialiased flex flex-col justify-between">
      <div className="flex-1">
        {children}
      </div>
      
      {/* Sub-footer Credits */}
      <div className="w-full py-6 border-t border-zinc-200 bg-white text-center shrink-0">
        <p className="text-xs text-zinc-500 tracking-wide font-sans font-medium">
          Incooperate with Myinvoice.Space | Powered by Digipro
        </p>
      </div>
    </div>
  );
}
