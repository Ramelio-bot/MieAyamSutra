-- ==========================================
-- SECURITY HARDENING: MIE AYAM SUTRA
-- Enable RLS + ownership policies + admin helper via RPC
-- ==========================================

-- 1. Add owner context for single-tenant app
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menus' AND column_name = 'owner_id') THEN
    ALTER TABLE menus ADD COLUMN owner_id UUID NOT NULL DEFAULT gen_random_uuid();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'owner_id') THEN
    ALTER TABLE orders ADD COLUMN owner_id UUID NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

-- 2. Ensure audit columns on orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
    ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_by') THEN
    ALTER TABLE orders ADD COLUMN updated_by TEXT DEFAULT 'system';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'last_status') THEN
    ALTER TABLE orders ADD COLUMN last_status TEXT;
  END IF;
END $$;

-- 3. Stable single-tenant owner id for demo/outlet
INSERT INTO menus (name, price, is_available, owner_id)
SELECT 'Outlet', 0, true, '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE owner_id = '00000000-0000-0000-0000-000000000001');

INSERT INTO orders (customer_name, customer_phone, delivery_address, total_amount, status, owner_id)
SELECT 'seed', '-', '-', 0, 'CANCELLED', '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE owner_id = '00000000-0000-0000-0000-000000000001');

-- 4. Enable RLS
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop old broad policies if present
DROP POLICY IF EXISTS "Public read menus" ON menus;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Admin all menus" ON menus;
DROP POLICY IF EXISTS "Admin all orders" ON orders;

-- 6. Public read menus, public insert orders
CREATE POLICY "Public read menus"
ON menus
FOR SELECT
TO public
USING (true);

CREATE POLICY "Public insert orders"
ON orders
FOR INSERT
TO public
WITH CHECK (true);

-- 7. App settings + admin PIN RPC
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES ('staff_pin', '9399') 
ON CONFLICT (key) DO UPDATE SET value = '9399';

CREATE OR REPLACE FUNCTION public.is_sutra_admin(pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM app_settings WHERE key = 'staff_pin' AND value = pin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_sutra_admin(text) TO public;

-- 8. Admin management policies with RPC gate
CREATE POLICY "Admin all menus"
ON menus
FOR ALL
TO public
USING (public.is_sutra_admin(current_setting('request.jwt.claims', true)::json->>'pin'));

CREATE POLICY "Admin all orders"
ON orders
FOR ALL
TO public
USING (public.is_sutra_admin(current_setting('request.jwt.claims', true)::json->>'pin'));

-- 9. Automatic order audit trigger
CREATE OR REPLACE FUNCTION public.set_order_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  IF (TG_OP = 'UPDATE') THEN
    NEW.last_status = OLD.status;
  ELSE
    NEW.last_status = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_audit ON orders;
CREATE TRIGGER trg_order_audit
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION public.set_order_audit();

-- 10. Ensure category column on menus table
ALTER TABLE menus ADD COLUMN IF NOT EXISTS category TEXT;

