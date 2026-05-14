-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL CHECK (country IN ('台灣', '韓國', '日本')),
  brand_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '已訂購' CHECK (status IN ('已訂購', '已出貨')),
  order_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  photo_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  currency TEXT NOT NULL DEFAULT 'TWD' CHECK (currency IN ('TWD', 'KRW', 'JPY')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_items_updated_at
  BEFORE UPDATE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow all operations (adjust per your auth requirements)
CREATE POLICY "Allow all operations on purchase_orders"
  ON purchase_orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on purchase_items"
  ON purchase_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Storage bucket for product photos
-- Run this in the Supabase Dashboard > Storage, or via the API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true);

-- Storage RLS policies for product-photos bucket
-- Allow public read access
CREATE POLICY "Public read access for product-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');

-- Allow authenticated and anonymous uploads
CREATE POLICY "Allow uploads to product-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-photos');

-- Allow updates to product-photos
CREATE POLICY "Allow updates in product-photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-photos');

-- Allow deletes in product-photos
CREATE POLICY "Allow deletes in product-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-photos');
