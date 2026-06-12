"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KDSPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-500 font-extrabold uppercase tracking-widest text-xs animate-pulse">
        Mengalihkan ke Pusat Kendali...
      </p>
    </div>
  );
}
