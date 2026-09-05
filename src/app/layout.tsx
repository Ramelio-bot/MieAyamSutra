import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-pjs",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Mie Ayam Sutra - Premium Salatiga Noodle",
  description: "Mie Halus, Lembut, & Tipis Tradisi Salatiga.",
  icons: {
    icon: "https://lh3.googleusercontent.com/d/1T4H6gY6qW3PCsfXdc8cf_PN6Gi3hCXyA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-pjs text-warm-charcoal bg-warm-white">{children}</body>
    </html>
  );
}
