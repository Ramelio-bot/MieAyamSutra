-- ==========================================================
-- SUTRA SECURITY & ANTI-FRAUD PATCH V5
-- Addresses Race Conditions and RLS Policies
-- ==========================================================

-- 1. FIX RACE CONDITION PADA CLAIM_REWARD
CREATE OR REPLACE FUNCTION claim_reward(p_member_id UUID, p_reward_title TEXT, p_stamps_cost INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stamps INTEGER;
  v_coupon_code TEXT;
BEGIN
  -- Lock the row to prevent race conditions (Anti-Fraud Bypass)
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

-- 2. HARDEN RLS PADA TABEL MEMBERS & COUPONS
-- Hanya RPC security definer yang boleh UPDATE stamps, public TIDAK BOLEH update tabel members.stamps_count
DROP POLICY IF EXISTS "Public update members" ON members;

CREATE POLICY "Public read members" ON members FOR SELECT TO public USING (true);
-- Memastikan tidak ada rule yang memperbolehkan UPDATE bebas
