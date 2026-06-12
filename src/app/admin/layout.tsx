export const metadata = {
  title: "Pusat Kendali - Mie Ayam Sutra",
  description: "Centralized Admin Dashboard & Kitchen Display System",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 antialiased overflow-hidden">
      {children}
    </div>
  );
}
