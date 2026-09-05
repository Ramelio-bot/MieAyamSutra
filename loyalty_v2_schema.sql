-- ==========================================
-- CUSTOMER PORTAL V2 SCHEMA UPDATE
-- Execute this in Supabase SQL Editor
-- ==========================================

-- 1. Enable pgcrypto for secure PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add PIN column to members table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'pin_hash') THEN
    ALTER TABLE members ADD COLUMN pin_hash TEXT;
  END IF;
END $$;

-- 3. Create 'coupons' table for claimed rewards
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reward_title TEXT NOT NULL,
  stamps_cost INTEGER NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  barcode_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'), -- Generates random hex code
  owner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read coupons" ON coupons;
DROP POLICY IF EXISTS "Admin all coupons" ON coupons;

-- Anyone (or members) can read coupons (we filter by member_id in frontend)
CREATE POLICY "Public read coupons" ON coupons FOR SELECT TO public USING (true);
CREATE POLICY "Public insert coupons" ON coupons FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update coupons" ON coupons FOR UPDATE TO public USING (true);

-- 5. RPC Function: Register Member with PIN
CREATE OR REPLACE FUNCTION register_member_with_pin(p_phone TEXT, p_name TEXT, p_pin TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  INSERT INTO members (phone, name, pin_hash)
  VALUES (p_phone, p_name, crypt(p_pin, gen_salt('bf')))
  RETURNING id INTO v_member_id;
  
  RETURN v_member_id;
END;
$$;

-- 6. RPC Function: Verify Member PIN
CREATE OR REPLACE FUNCTION verify_member_pin(p_phone TEXT, p_pin TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  stamps_count INTEGER,
  total_rewards_claimed INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.phone, m.stamps_count, m.total_rewards_claimed
  FROM members m
  WHERE m.phone = p_phone
    AND m.pin_hash = crypt(p_pin, m.pin_hash);
END;
$$;

-- 7. RPC Function: Claim Reward (Deduct Stamps & Create Coupon)
CREATE OR REPLACE FUNCTION claim_reward(p_member_id UUID, p_reward_title TEXT, p_stamps_cost INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stamps INTEGER;
  v_coupon_code TEXT;
BEGIN
  -- Lock the row to prevent race conditions (Anti-Fraud)
  SELECT stamps_count INTO v_current_stamps 
  FROM members 
  WHERE id = p_member_id 
  FOR UPDATE;
  
  IF v_current_stamps < p_stamps_cost THEN
    RAISE EXCEPTION 'Stamps tidak cukup';
  END IF;

  -- Deduct stamps
  UPDATE members 
  SET stamps_count = stamps_count - p_stamps_cost 
  WHERE id = p_member_id;

  -- Insert coupon
  INSERT INTO coupons (member_id, reward_title, stamps_cost)
  VALUES (p_member_id, p_reward_title, p_stamps_cost)
  RETURNING barcode_code INTO v_coupon_code;

  RETURN v_coupon_code;
END;
$$;
