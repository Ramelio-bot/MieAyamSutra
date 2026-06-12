import { MenuItem } from "@/types";

export const MOCK_MENUS: MenuItem[] = [
  // 1. Mie Klasik & Kuah
  {
    id: "c1_1",
    name: "Mie Ayam Ori",
    description: "Mie ayam klasik premium dengan racikan bumbu khas Sutra.",
    price: 15000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_2",
    name: "Mie Ayam Ceker",
    description: "Mie ayam klasik ditambah topping ceker empuk bumbu gurih.",
    price: 18000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_3",
    name: "Mie Ayam Kari",
    description: "Mie ayam klasik dengan kuah kari gurih kental berempah.",
    price: 18000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_4",
    name: "Mie Ayam Pangsit Goreng",
    description: "Mie ayam klasik disajikan dengan pangsit goreng renyah.",
    price: 20000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_5",
    name: "Mie Ayam Pangsit Kuah",
    description: "Mie ayam klasik disajikan dengan pangsit rebus kuah kaldu.",
    price: 20000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_6",
    name: "Mie Ayam Bakso",
    description: "Mie ayam klasik dengan tambahan bakso sapi urat kenyal.",
    price: 21000,
    is_available: true,
    category: "Mie Klasik"
  },
  {
    id: "c1_7",
    name: "Mie Ayam Komplit",
    description: "Porsi komplit! Mie ayam dengan ceker, bakso, dan pangsit.",
    price: 27000,
    is_available: true,
    category: "Mie Klasik"
  },

  // 2. Miago (Mie Goreng)
  {
    id: "c2_1",
    name: "Miago Ori",
    description: "Mie goreng manis gurih khas Miago dengan taburan ayam cincang.",
    price: 19000,
    is_available: true,
    category: "Miago"
  },
  {
    id: "c2_2",
    name: "Miago Ceker",
    description: "Mie goreng Miago dengan tambahan topping ceker empuk.",
    price: 20000,
    is_available: true,
    category: "Miago"
  },
  {
    id: "c2_3",
    name: "Miago Pangsit Goreng",
    description: "Mie goreng Miago disajikan dengan pangsit goreng renyah.",
    price: 22000,
    is_available: true,
    category: "Miago"
  },
  {
    id: "c2_4",
    name: "Miago Pangsit Kuah",
    description: "Mie goreng Miago disajikan dengan pangsit rebus kuah hangat.",
    price: 22000,
    is_available: true,
    category: "Miago"
  },
  {
    id: "c2_5",
    name: "Miago Bakso",
    description: "Mie goreng Miago dengan tambahan topping bakso sapi gurih.",
    price: 23000,
    is_available: true,
    category: "Miago"
  },
  {
    id: "c2_6",
    name: "Miago Komplit",
    description: "Mie goreng Miago komplit dengan ceker, bakso, dan pangsit.",
    price: 29000,
    is_available: true,
    category: "Miago"
  },

  // 3. Mie Pedas (Chili Oil & Meriam)
  {
    id: "c3_1",
    name: "Mie Chili Oil Ori",
    description: "Mie gurih dengan balutan chili oil pedas mantap buatan sendiri.",
    price: 18000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_2",
    name: "Mie Chili Oil Ceker",
    description: "Mie chili oil pedas dengan topping ceker empuk bumbu gurih.",
    price: 21000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_3",
    name: "Mie Chili Oil Pangsit Goreng",
    description: "Mie chili oil pedas dengan pangsit goreng renyah.",
    price: 21000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_4",
    name: "Mie Chili Oil Pangsit Kuah",
    description: "Mie chili oil pedas dengan pangsit rebus kuah hangat.",
    price: 21000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_5",
    name: "Mie Chili Oil Bakso",
    description: "Mie chili oil pedas dengan tambahan bakso sapi urat.",
    price: 22000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_6",
    name: "Mie Chili Oil Komplit",
    description: "Mie chili oil komplit dengan ceker, bakso, dan pangsit.",
    price: 28000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_7",
    name: "Mie Meriam Ori",
    description: "Mie dengan kepedasan meledak-ledak saus Meriam khas Sutra.",
    price: 20000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_8",
    name: "Mie Meriam Ceker",
    description: "Mie Meriam pedas berlevel dengan topping ceker empuk.",
    price: 23000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_9",
    name: "Mie Meriam Pangsit Goreng",
    description: "Mie Meriam pedas berlevel dengan pangsit goreng renyah.",
    price: 23000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_10",
    name: "Mie Meriam Pangsit Kuah",
    description: "Mie Meriam pedas berlevel dengan pangsit rebus kuah hangat.",
    price: 23000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_11",
    name: "Mie Meriam Bakso",
    description: "Mie Meriam pedas berlevel dengan tambahan bakso sapi.",
    price: 24000,
    is_available: true,
    category: "Mie Pedas"
  },
  {
    id: "c3_12",
    name: "Mie Meriam Komplit",
    description: "Mie Meriam super komplit dengan ceker, bakso, dan pangsit.",
    price: 30000,
    is_available: true,
    category: "Mie Pedas"
  },

  // 4. Rice Bowl & Western Steak
  {
    id: "c4_1",
    name: "rb Hot Lava",
    description: "Rice Bowl dengan ayam krispi berselimut saus pedas hot lava.",
    price: 14000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_2",
    name: "rb BBQ",
    description: "Rice Bowl dengan ayam krispi berselimut saus BBQ gurih manis.",
    price: 14000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_3",
    name: "rb Blackpepper",
    description: "Rice Bowl dengan ayam krispi berselimut saus lada hitam hangat.",
    price: 14000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_4",
    name: "rb Mayo",
    description: "Rice Bowl dengan ayam krispi bertabur saus mayones lembut.",
    price: 14000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_5",
    name: "rb Teriyaki",
    description: "Rice Bowl dengan ayam krispi berbalur saus teriyaki khas Jepang.",
    price: 14000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_6",
    name: "rb Mentai",
    description: "Rice Bowl dengan ayam krispi disiram saus mentai gurih dibakar.",
    price: 15000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_7",
    name: "Steak Chicken",
    description: "Steak ayam krispi premium disajikan dengan sayuran dan kentang goreng.",
    price: 18000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_8",
    name: "Merit 1",
    description: "Steak ayam krispi dengan racikan bumbu spesial Merit Level 1.",
    price: 20000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_9",
    name: "Original Steak",
    description: "Steak ayam panggang/grill original khas barat dengan saus premium.",
    price: 23000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_10",
    name: "Double Chicken Steak",
    description: "Porsi dobel! Dua lapis steak ayam krispi untuk kepuasan maksimal.",
    price: 28000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_11",
    name: "Merit 4",
    description: "Steak ayam krispi porsi besar dengan racikan bumbu Merit Level 4.",
    price: 33000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },
  {
    id: "c4_12",
    name: "Merit 3",
    description: "Steak ayam grill porsi besar dengan racikan bumbu Merit Level 3.",
    price: 34000,
    is_available: true,
    category: "Rice Bowl & Steak"
  },

  // 5. Camilan & Extra Toppings
  {
    id: "c5_1",
    name: "Kerupuk Rejo",
    description: "Kerupuk renyah pendamping makan mie ayam.",
    price: 1000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_2",
    name: "Nasi",
    description: "Nasi putih hangat pulen.",
    price: 3000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_3",
    name: "Pangsit Goreng (Add-on/Pcs)",
    description: "Satu buah pangsit goreng renyah isi ayam cincang.",
    price: 3000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_4",
    name: "Pangsit Kuah (Add-on/Pcs)",
    description: "Satu buah pangsit rebus lembut isi ayam cincang.",
    price: 3000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_5",
    name: "Saus",
    description: "Ekstra saus sambal atau saus steak tambahan.",
    price: 3000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_6",
    name: "Ceker (Satuan/Topping)",
    description: "Satu buah topping ceker empuk bumbu kecap.",
    price: 3000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_7",
    name: "Bakso (Add-on/Topping)",
    description: "Satu buah bakso sapi urat kenyal.",
    price: 4000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_8",
    name: "Ala carte (15)",
    description: "Porsi ala carte ekstra bumbu tambahan.",
    price: 5000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_9",
    name: "Ekstra Ayam",
    description: "Ekstra topping daging ayam cincang kecap.",
    price: 5000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_10",
    name: "Telur",
    description: "Tambahan telur rebus/mata sapi/dadar.",
    price: 5000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_11",
    name: "FF Madness",
    description: "Kentang goreng renyah dengan taburan bumbu gurih.",
    price: 9000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_12",
    name: "FF Porsi 2",
    description: "Kentang goreng porsi sharing berdua.",
    price: 9000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_13",
    name: "Komplit (Extra Add-on)",
    description: "Ekstra kombinasi ceker, bakso, dan pangsit.",
    price: 10000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_14",
    name: "Pangsit Goreng (5 pcs)",
    description: "Satu porsi berisi 5 buah pangsit goreng isi ayam.",
    price: 12000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_15",
    name: "Pangsit Kuah (5 pcs)",
    description: "Satu porsi berisi 5 buah pangsit rebus kuah kaldu.",
    price: 12000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_16",
    name: "Bakso Goreng Original",
    description: "Satu porsi berisi 3 buah bakso goreng renyah gurih.",
    price: 12000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_17",
    name: "Ceker (5 pcs)",
    description: "Satu porsi berisi 5 buah ceker empuk manis gurih.",
    price: 12000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_18",
    name: "Bakso Goreng",
    description: "Satu porsi bakso goreng ukuran besar/spesial.",
    price: 15000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_19",
    name: "Bakso Goreng Pangsit Kuah",
    description: "Kombinasi bakso goreng dan pangsit rebus kuah.",
    price: 15000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_20",
    name: "Pangsit Chili Oil",
    description: "Satu porsi pangsit rebus lembut berselimut chili oil pedas.",
    price: 18000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_21",
    name: "Pangsit Gongso",
    description: "Satu porsi pangsit rebus yang ditumis/digongso bumbu manis pedas.",
    price: 18000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_22",
    name: "Porsi Custom Jumbo (Noodle Add-on)",
    description: "Tambahan porsi mie ekstra besar (Jumbo).",
    price: 5000,
    is_available: true,
    category: "Camilan"
  },
  {
    id: "c5_23",
    name: "Porsi Custom Monster (Noodle Add-on)",
    description: "Tambahan porsi mie ukuran raksasa (Monster).",
    price: 25000,
    is_available: true,
    category: "Camilan"
  },

  // 6. Minuman
  {
    id: "c6_1",
    name: "Air Putih",
    description: "Air putih segar.",
    price: 1000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_2",
    name: "Air Es",
    description: "Air es segar dingin.",
    price: 2000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_3",
    name: "Es Teh Tawar",
    description: "Es teh segar tanpa gula.",
    price: 4000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_4",
    name: "Es Teh",
    description: "Es teh manis segar khas melati.",
    price: 5000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_5",
    name: "Es Jeruk",
    description: "Es jeruk manis peras segar.",
    price: 5000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_6",
    name: "Es Capucino",
    description: "Es kopi cappucino dingin dengan krim lembut.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_7",
    name: "Es Jeruk Nipis",
    description: "Es jeruk nipis segar kaya vitamin C.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_8",
    name: "Es Milo",
    description: "Es cokelat susu Milo hangat kuku dan es batu.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_9",
    name: "Es Jeruk Peras",
    description: "Es jeruk peras manis asli tanpa pemanis buatan.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_10",
    name: "Es Lemon Tea",
    description: "Es teh rasa lemon yang menyegarkan dahaga.",
    price: 7000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_11",
    name: "Es Leci Tea",
    description: "Es teh dengan aroma leci manis segar.",
    price: 7000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_12",
    name: "Es Teh Kampul",
    description: "Es teh khas Solo dengan irisan jeruk nipis/wedang.",
    price: 8000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_13",
    name: "Es Teh Jumbo",
    description: "Es teh manis dalam gelas ukuran ekstra besar.",
    price: 8000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_14",
    name: "Es Milo Dino",
    description: "Es Milo dingin dengan taburan bubuk cokelat melimpah di atasnya.",
    price: 11000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_15",
    name: "Teh Tawar Hangat",
    description: "Teh hangat tawar pembersih tenggorokan.",
    price: 3000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_16",
    name: "Teh Hangat",
    description: "Teh manis hangat aromatik.",
    price: 4000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_17",
    name: "Capucino Hangat",
    description: "Kopi cappucino hangat nikmat.",
    price: 5000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_18",
    name: "Jeruk Nipis Hangat",
    description: "Jeruk nipis hangat pereda lelah.",
    price: 5000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_19",
    name: "Milo Hangat",
    description: "Susu cokelat Milo hangat penambah energi.",
    price: 5000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_20",
    name: "Lemon Tea Hangat",
    description: "Teh lemon hangat menyegarkan.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_21",
    name: "Leci Tea Hangat",
    description: "Teh leci hangat manis wangi.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_22",
    name: "Teh Tarik Hangat",
    description: "Teh susu ditarik tradisional hangat berbusa.",
    price: 6000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_23",
    name: "Teh Kampul Hangat",
    description: "Teh kampul hangat beraroma jeruk wedang.",
    price: 7000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_24",
    name: "Minuman 2 Varian Rasa",
    description: "Kombinasi campuran 2 varian rasa pilihan.",
    price: 7000,
    is_available: true,
    category: "Minuman"
  },
  {
    id: "c6_25",
    name: "Minuman 3 Varian Rasa",
    description: "Kombinasi campuran 3 varian rasa pilihan.",
    price: 8000,
    is_available: true,
    category: "Minuman"
  }
];

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};
