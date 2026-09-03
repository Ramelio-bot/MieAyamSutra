-- ==========================================
-- DIGITAL LOYALTY CARD SCHEMA - MIE AYAM SUTRA
-- Copy and paste this directly into Supabase SQL Editor
-- ==========================================

-- 1. Create 'members' Table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stamps_count INTEGER DEFAULT 0,
  total_rewards_claimed INTEGER DEFAULT 0,
  owner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create 'stamp_logs' Table
CREATE TABLE IF NOT EXISTS stamp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stamps_added INTEGER NOT NULL,
  cashier_note TEXT,
  owner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create 'reward_claims' Table
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reward_title TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, redeemed, expired
  owner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if running multiple times
DROP POLICY IF EXISTS "Public read members" ON members;
DROP POLICY IF EXISTS "Public insert members" ON members;
DROP POLICY IF EXISTS "Admin all members" ON members;
DROP POLICY IF EXISTS "Admin all stamp logs" ON stamp_logs;
DROP POLICY IF EXISTS "Admin all reward claims" ON reward_claims;
DROP POLICY IF EXISTS "Public read own reward claims" ON reward_claims;
DROP POLICY IF EXISTS "Public insert reward claims" ON reward_claims;

-- 6. Member Policies
CREATE POLICY "Public read members"
ON members FOR SELECT TO public
USING (true);

CREATE POLICY "Public insert members"
ON members FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Admin all members"
ON members FOR ALL TO public
USING (public.is_sutra_admin(current_setting('request.jwt.claims', true)::json->>'pin'));

-- 7. Stamp Logs Policies
-- Only Admin can insert/modify stamps (prevent customer abuse)
CREATE POLICY "Admin all stamp logs"
ON stamp_logs FOR ALL TO public
USING (public.is_sutra_admin(current_setting('request.jwt.claims', true)::json->>'pin'));

-- 8. Reward Claims Policies
CREATE POLICY "Public insert reward claims"
ON reward_claims FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Public read reward claims"
ON reward_claims FOR SELECT TO public
USING (true);

CREATE POLICY "Admin all reward claims"
ON reward_claims FOR ALL TO public
USING (public.is_sutra_admin(current_setting('request.jwt.claims', true)::json->>'pin'));

-- 9. Automatic Audit Trigger for Members
CREATE OR REPLACE FUNCTION public.set_member_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_audit ON members;
CREATE TRIGGER trg_member_audit
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION public.set_member_audit();
