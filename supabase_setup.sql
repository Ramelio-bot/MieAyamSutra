-- ==========================================
-- SQL SETUP SCRIPT - MIE AYAM SUTRA
-- Copy and paste this directly into Supabase SQL Editor
-- ==========================================

-- 1. Enable Extension for UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create 'menus' Table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create 'orders' Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  items JSONB NOT NULL, -- Array of CartItem: { id, name, qty, price, notes }
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'CASH / TALANGAN JEGGBOY',
  status TEXT DEFAULT 'PENDING', -- PENDING, PREPARING, COMPLETED, CANCELLED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Disable Row Level Security (RLS) for anonymous public read & insert
-- This allows anyone to place orders and read the menu without authentication.
ALTER TABLE menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 5. Enable Real-time Replication / Postgres Changes for 'orders' table
-- This allows the Kitchen Display System (/dapur) to subscribe to real-time order updates.
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 6. Pre-populate 'menus' Table with Signature Products
INSERT INTO menus (name, description, price, is_available) VALUES
('Mie Ayam Biasa', 'Mie ayam original dengan potongan ayam kecap gurih, sayur sawi, dan kuah kaldu asli.', 15000.00, true),
('Mie Ayam Bakso', 'Mie ayam original ditambah 2 buah bakso sapi urat yang kenyal dan nikmat.', 20000.00, true),
('Mie Ayam Pangsit', 'Mie ayam original dengan tambahan 3 buah pangsit rebus isi daging ayam cincang.', 19000.00, true),
('Mie Ayam Komplit Sutra', 'Porsi jumbo! Mie ayam dengan topping ayam melimpah, bakso, pangsit rebus, dan kerupuk pangsit.', 25000.00, true),
('Es Teh Manis', 'Teh melati seduh asli dengan gula batu.', 4000.00, true),
('Es Jeruk Peras', 'Jeruk peras murni yang menyegarkan dahaga.', 6000.00, true)
ON CONFLICT DO NOTHING;
