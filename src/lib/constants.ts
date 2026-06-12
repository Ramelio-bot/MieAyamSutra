import { MenuItem } from "@/types";

export const MOCK_MENUS: MenuItem[] = [
  {
    id: "m1",
    name: "Mie Ayam Biasa",
    description: "Mie ayam original dengan potongan ayam kecap gurih, sayur sawi, dan kuah kaldu asli.",
    price: 15000,
    is_available: true,
  },
  {
    id: "m2",
    name: "Mie Ayam Bakso",
    description: "Mie ayam original ditambah 2 buah bakso sapi urat yang kenyal dan nikmat.",
    price: 20000,
    is_available: true,
  },
  {
    id: "m3",
    name: "Mie Ayam Pangsit",
    description: "Mie ayam original dengan tambahan 3 buah pangsit rebus isi daging ayam cincang.",
    price: 19000,
    is_available: true,
  },
  {
    id: "m4",
    name: "Mie Ayam Komplit Sutra",
    description: "Porsi jumbo! Mie ayam dengan topping ayam melimpah, bakso, pangsit rebus, dan kerupuk pangsit.",
    price: 25000,
    is_available: true,
  },
  {
    id: "m5",
    name: "Es Teh Manis",
    description: "Teh melati seduh asli dengan gula batu.",
    price: 4000,
    is_available: true,
  },
  {
    id: "m6",
    name: "Es Jeruk Peras",
    description: "Jeruk peras murni yang menyegarkan dahaga.",
    price: 6000,
    is_available: true,
  }
];

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};
