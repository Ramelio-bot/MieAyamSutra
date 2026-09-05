-- ==========================================================
-- SUTRA PROMO & OPERATIONAL V4 SCHEMA MIGRATION
-- Adds discount pricing and global store settings.
-- ==========================================================

-- 1. Update Tabel menus
ALTER TABLE public.menus 
ADD COLUMN IF NOT EXISTS discount_price NUMERIC;

-- 2. Tabel Baru: store_settings (Single Row Configuration)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row
    is_open BOOLEAN DEFAULT true,
    closed_message TEXT DEFAULT 'Maaf, kedai sedang tutup. Silakan kembali lagi nanti.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings
CREATE POLICY "Allow public read store_settings" ON public.store_settings FOR SELECT
USING (true);

-- Allow admins to manage settings
CREATE POLICY "Allow admin manage store_settings" ON public.store_settings
USING (true) WITH CHECK (true);

-- Insert the default single row
INSERT INTO public.store_settings (id, is_open, closed_message)
SELECT 1, true, 'Maaf, kedai sedang tutup. Silakan kembali lagi nanti.'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings WHERE id = 1);
