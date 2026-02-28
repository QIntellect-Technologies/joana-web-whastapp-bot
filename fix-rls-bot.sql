-- Allow Public/Anonymous inserts into orders (required for the Bot)
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);

-- Allow Public/Anonymous inserts into voice_text_orders
DROP POLICY IF EXISTS "Public can insert voice_text_orders" ON voice_text_orders;
CREATE POLICY "Public can insert voice_text_orders" ON voice_text_orders FOR INSERT WITH CHECK (true);

-- Ensure RLS is enabled but policies allow the action
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_text_orders ENABLE ROW LEVEL SECURITY;

-- Also allow public to read menu for future dynamic menu sync
DROP POLICY IF EXISTS "Public can read orders status" ON orders;
CREATE POLICY "Public can read orders status" ON orders FOR SELECT USING (true);
