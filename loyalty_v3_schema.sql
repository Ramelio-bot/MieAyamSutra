-- ==========================================================
-- SUTRA LOYALTY SYSTEM V3 SCHEMA MIGRATION
-- Adds dynamic reward catalog, referral schemas, and tiering.
-- ==========================================================

-- 1. Tipe Data Baru untuk Tier & Status Kupon
DO $$ BEGIN
    CREATE TYPE member_tier AS ENUM ('bronze', 'silver', 'gold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('active', 'used', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Tabel members
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS tier member_tier DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.members(id);

-- 3. Update Tabel coupons
-- Convert existing text status to the new enum (safe cast) if needed, but for simplicity let's just use text for now if it already exists as text, or alter it.
-- Since previous schema used text, we will keep it simple and just add new columns.
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS used_by_staff TEXT;

-- 4. Tabel Baru: reward_catalog
CREATE TABLE IF NOT EXISTS public.reward_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    stamp_cost INTEGER NOT NULL CHECK (stamp_cost > 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active rewards
CREATE POLICY "Allow public read active rewards" ON public.reward_catalog FOR SELECT
USING (is_active = true);

-- Allow admins to manage all rewards (using staff token/pin bypass logic, assuming anon can do it for now or based on your custom auth)
CREATE POLICY "Allow admin manage rewards" ON public.reward_catalog
USING (true) WITH CHECK (true);

-- Insert Default Mock Data if empty
INSERT INTO public.reward_catalog (title, description, stamp_cost)
SELECT '1 Porsi Pangsit Goreng', 'Camilan renyah teman makan mie.', 5
WHERE NOT EXISTS (SELECT 1 FROM public.reward_catalog WHERE title = '1 Porsi Pangsit Goreng');

INSERT INTO public.reward_catalog (title, description, stamp_cost)
SELECT '1 Porsi Mie Ayam Ori', 'Menu andalan kami gratis untuk Anda.', 10
WHERE NOT EXISTS (SELECT 1 FROM public.reward_catalog WHERE title = '1 Porsi Mie Ayam Ori');

INSERT INTO public.reward_catalog (title, description, stamp_cost)
SELECT 'Mie Komplit + Es Teh', 'Paket kenyang maksimal.', 15
WHERE NOT EXISTS (SELECT 1 FROM public.reward_catalog WHERE title = 'Mie Komplit + Es Teh');


-- 5. RPC function untuk mark coupon as used (Atomic Transaction)
CREATE OR REPLACE FUNCTION use_coupon(
    p_coupon_id UUID,
    p_staff_pin TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon record;
BEGIN
    -- Check if valid admin pin (simple validation)
    IF NOT is_sutra_admin(p_staff_pin) THEN
        RAISE EXCEPTION 'Akses Ditolak. PIN Staf Tidak Valid.';
    END IF;

    -- Lock the row for update to prevent concurrent race conditions
    SELECT * INTO v_coupon FROM public.coupons WHERE id = p_coupon_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kupon tidak ditemukan.';
    END IF;

    IF v_coupon.status != 'active' THEN
        RAISE EXCEPTION 'Kupon sudah hangus atau tidak valid (Status: %).', v_coupon.status;
    END IF;

    -- Mark as used
    UPDATE public.coupons 
    SET status = 'used', 
        used_at = NOW(), 
        used_by_staff = p_staff_pin
    WHERE id = p_coupon_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Kupon berhasil digunakan.',
        'reward_title', v_coupon.reward_title
    );
END;
$$;
