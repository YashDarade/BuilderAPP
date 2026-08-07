-- ============================================================
-- MIGRATION 032: VENDOR MANAGEMENT & PROCUREMENT
-- ============================================================

-- Vendor status enum
CREATE TYPE vendor_status AS ENUM ('active', 'inactive');

-- Purchase order status enum
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'partially_delivered', 'delivered', 'cancelled');

-- Payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'cheque', 'bank_transfer');

-- Payment status enum (for a PO's payment state)
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');

-- Material category for vendor specialization
CREATE TYPE material_category AS ENUM (
  'Cement', 'Steel', 'Sand', 'Bricks', 'Tiles', 'Pipes',
  'Paint', 'Electrical', 'Plumbing', 'Timber', 'Aggregate',
  'Hardware', 'Chemicals', 'Other'
);

-- ============================================================
-- VENDORS TABLE
-- ============================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  gst_number TEXT,
  address TEXT,
  material_categories material_category[] DEFAULT '{}',
  payment_terms_days INTEGER DEFAULT 30,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  status vendor_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  search_vector tsvector
);

CREATE INDEX idx_vendors_org_id ON vendors(org_id);
CREATE INDEX idx_vendors_status ON vendors(org_id, status);
CREATE INDEX idx_vendors_phone ON vendors(org_id, phone);
CREATE INDEX idx_vendors_business_name ON vendors(org_id, business_name);
CREATE INDEX idx_vendors_search ON vendors USING GIN(search_vector);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PURCHASE ORDERS TABLE
-- ============================================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  po_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status po_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  transport_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  search_vector tsvector
);

CREATE INDEX idx_purchase_orders_org_id ON purchase_orders(org_id);
CREATE INDEX idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(org_id, status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(org_id, po_number);
CREATE INDEX idx_purchase_orders_po_date ON purchase_orders(org_id, po_date);
CREATE INDEX idx_purchase_orders_search ON purchase_orders USING GIN(search_vector);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PO LINE ITEMS TABLE
-- ============================================================
CREATE TABLE po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  quantity_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity_pending DECIMAL(12,2) GENERATED ALWAYS AS (quantity - quantity_received) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_items_po_id ON po_items(po_id);

ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MATERIAL RECEIVINGS TABLE (delivery records)
-- ============================================================
CREATE TABLE material_receivings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  po_item_id UUID NOT NULL REFERENCES po_items(id) ON DELETE RESTRICT,
  received_quantity DECIMAL(12,2) NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_material_receivings_org_id ON material_receivings(org_id);
CREATE INDEX idx_material_receivings_po_id ON material_receivings(po_id);

ALTER TABLE material_receivings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VENDOR PAYMENTS TABLE
-- ============================================================
CREATE TABLE vendor_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_payments_org_id ON vendor_payments(org_id);
CREATE INDEX idx_vendor_payments_po_id ON vendor_payments(po_id);
CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_date ON vendor_payments(org_id, payment_date);

ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VENDOR SEARCH TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION vendors_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.business_name,'') || ' ' ||
    coalesce(NEW.owner_name,'') || ' ' ||
    coalesce(NEW.phone,'') || ' ' ||
    coalesce(NEW.gst_number,'') || ' ' ||
    coalesce(NEW.address,'') || ' ' ||
    coalesce(array_to_string(NEW.material_categories, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendors_search ON vendors;
CREATE TRIGGER trg_vendors_search BEFORE INSERT OR UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION vendors_search_trigger();

-- ============================================================
-- PURCHASE ORDER SEARCH TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION purchase_orders_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.po_number,'') || ' ' ||
    coalesce(NEW.notes,'')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_orders_search ON purchase_orders;
CREATE TRIGGER trg_purchase_orders_search BEFORE INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION purchase_orders_search_trigger();

-- ============================================================
-- AUTO-GENERATE PO NUMBER
-- ============================================================
CREATE OR REPLACE FUNCTION generate_po_number(p_org_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT 'PO-' || LPAD(
    COALESCE(
      (SELECT COUNT(*)::TEXT FROM public.purchase_orders
       WHERE org_id = p_org_id AND deleted_at IS NULL),
      '0'
    ),
    3, '0'
  );
$$;

-- ============================================================
-- AUTO-UPDATE PO TOTALS WHEN ITEMS CHANGE
-- ============================================================
CREATE OR REPLACE FUNCTION update_po_totals_from_items()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);

  UPDATE public.purchase_orders SET
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.po_items WHERE po_id = v_po_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.po_items WHERE po_id = v_po_id
    ) + tax_amount + transport_amount,
    updated_at = NOW()
  WHERE id = v_po_id;

  -- Update balance_due
  UPDATE public.purchase_orders SET
    balance_due = total_amount - total_paid
  WHERE id = v_po_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_po_totals ON po_items;
CREATE TRIGGER trg_update_po_totals
  AFTER INSERT OR UPDATE OR DELETE ON po_items
  FOR EACH ROW EXECUTE FUNCTION update_po_totals_from_items();

-- ============================================================
-- AUTO-UPDATE PO PAYMENT STATUS WHEN PAYMENT IS MADE
-- ============================================================
CREATE OR REPLACE FUNCTION update_po_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);

  UPDATE public.purchase_orders SET
    total_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.vendor_payments WHERE po_id = v_po_id
    ),
    updated_at = NOW()
  WHERE id = v_po_id;

  -- Update payment_status
  UPDATE public.purchase_orders SET
    balance_due = total_amount - total_paid,
    payment_status = CASE
      WHEN total_paid >= total_amount THEN 'paid'::payment_status
      WHEN total_paid > 0 THEN 'partial'::payment_status
      ELSE 'unpaid'::payment_status
    END
  WHERE id = v_po_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_po_payment ON vendor_payments;
CREATE TRIGGER trg_update_po_payment
  AFTER INSERT OR DELETE ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION update_po_payment_status();

-- ============================================================
-- AUTO-UPDATE PO STATUS WHEN ALL ITEMS FULLY RECEIVED
-- ============================================================
CREATE OR REPLACE FUNCTION update_po_status_on_receive()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_all_received BOOLEAN;
BEGIN
  v_po_id := NEW.po_id;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.po_items
    WHERE po_id = v_po_id AND quantity_received < quantity
  ) INTO v_all_received;

  IF v_all_received THEN
    UPDATE public.purchase_orders
    SET status = 'delivered'::po_status, updated_at = NOW()
    WHERE id = v_po_id AND status != 'cancelled'::po_status;
  ELSIF (
    SELECT SUM(quantity_received) FROM public.po_items WHERE po_id = v_po_id
  ) > 0 THEN
    UPDATE public.purchase_orders
    SET status = 'partially_delivered'::po_status, updated_at = NOW()
    WHERE id = v_po_id AND status IN ('draft'::po_status, 'sent'::po_status);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_po_status_receive ON material_receivings;
CREATE TRIGGER trg_update_po_status_receive
  AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION update_po_status_on_receive();

-- ============================================================
-- AUTO-UPDATE PO ITEMS QUANTITY RECEIVED ON RECEIVE
-- ============================================================
CREATE OR REPLACE FUNCTION update_po_item_received_qty()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.po_items SET
    quantity_received = (
      SELECT COALESCE(SUM(received_quantity), 0)
      FROM public.material_receivings WHERE po_item_id = NEW.po_item_id
    )
  WHERE id = NEW.po_item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_item_received ON material_receivings;
CREATE TRIGGER trg_update_item_received
  AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION update_po_item_received_qty();

-- ============================================================
-- TRIGGER: On PO delivery, auto-sync materials inventory
-- ============================================================
CREATE OR REPLACE FUNCTION sync_material_inventory_on_receive()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_material_name TEXT;
  v_po_item po_items%ROWTYPE;
BEGIN
  -- Get PO project_id
  SELECT project_id INTO v_project_id
  FROM public.purchase_orders WHERE id = NEW.po_id;

  -- Get the po_item details
  SELECT * INTO v_po_item
  FROM public.po_items WHERE id = NEW.po_item_id;

  v_material_name := v_po_item.material_name;

  -- Update or insert into materials table
  IF EXISTS (
    SELECT 1 FROM public.materials
    WHERE project_id = v_project_id
      AND name = v_material_name
      AND unit = v_po_item.unit
      AND deleted_at IS NULL
  ) THEN
    UPDATE public.materials SET
      quantity_purchased = quantity_purchased + NEW.received_quantity,
      updated_at = NOW()
    WHERE project_id = v_project_id
      AND name = v_material_name
      AND unit = v_po_item.unit
      AND deleted_at IS NULL;
  ELSE
    INSERT INTO public.materials (
      project_id, org_id, name, category, quantity_purchased,
      quantity_used, unit, cost_per_unit, vendor, reorder_level
    ) VALUES (
      v_project_id,
      NEW.org_id,
      v_material_name,
      'Other'::material_category,
      NEW.received_quantity,
      0,
      v_po_item.unit,
      v_po_item.unit_price,
      (SELECT business_name FROM public.vendors WHERE id = (
        SELECT vendor_id FROM public.purchase_orders WHERE id = NEW.po_id
      )),
      0
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_materials ON material_receivings;
CREATE TRIGGER trg_sync_materials
  AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION sync_material_inventory_on_receive();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- VENDORS
CREATE POLICY "Org owners can manage all vendors" ON vendors
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org vendors" ON vendors
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org vendors" ON vendors
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- PURCHASE ORDERS
CREATE POLICY "Org owners can manage all POs" ON purchase_orders
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org POs" ON purchase_orders
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org POs" ON purchase_orders
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- PO ITEMS (access via parent PO's org_id)
CREATE POLICY "Org owners can manage all PO items" ON po_items
  FOR ALL USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
    )
  );

CREATE POLICY "Engineers can manage PO items" ON po_items
  FOR ALL USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
    )
  );

CREATE POLICY "Clients can view PO items" ON po_items
  FOR SELECT USING (
    po_id IN (
      SELECT id FROM purchase_orders
      WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
    )
  );

-- MATERIAL RECEIVINGS
CREATE POLICY "Org owners can manage all receivings" ON material_receivings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org receivings" ON material_receivings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org receivings" ON material_receivings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- VENDOR PAYMENTS
CREATE POLICY "Org owners can manage all payments" ON vendor_payments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org payments" ON vendor_payments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org payments" ON vendor_payments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE po_items;
ALTER PUBLICATION supabase_realtime ADD TABLE material_receivings;
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_payments;
