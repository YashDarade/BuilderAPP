-- ============================================================
-- MIGRATION 033: VENDOR MANAGEMENT RPC FUNCTIONS
-- ============================================================

-- ============================================================
-- ENSURE ENUM TYPES EXIST (in case 032 partially failed)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status') THEN
    CREATE TYPE vendor_status AS ENUM ('active', 'inactive');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
    CREATE TYPE po_status AS ENUM ('draft', 'sent', 'partially_delivered', 'delivered', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'cheque', 'bank_transfer');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
  END IF;
END $$;

-- ============================================================
-- ENSURE TABLES EXIST (in case 032 partially failed)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'po_items') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'material_receivings') THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_payments') THEN
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
  END IF;
END $$;

-- ============================================================
-- ENSURE TRIGGERS EXIST
-- ============================================================
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VENDOR SEARCH TRIGGER
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

-- PO SEARCH TRIGGER
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

-- PO NUMBER GENERATION
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

-- AUTO-UPDATE PO TOTALS
CREATE OR REPLACE FUNCTION update_po_totals_from_items()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);
  UPDATE public.purchase_orders SET
    subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM public.po_items WHERE po_id = v_po_id),
    total_amount = (SELECT COALESCE(SUM(total_price), 0) FROM public.po_items WHERE po_id = v_po_id) + tax_amount + transport_amount,
    updated_at = NOW()
  WHERE id = v_po_id;
  UPDATE public.purchase_orders SET balance_due = total_amount - total_paid WHERE id = v_po_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_po_totals ON po_items;
CREATE TRIGGER trg_update_po_totals AFTER INSERT OR UPDATE OR DELETE ON po_items
  FOR EACH ROW EXECUTE FUNCTION update_po_totals_from_items();

-- AUTO-UPDATE PO PAYMENT STATUS
CREATE OR REPLACE FUNCTION update_po_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
BEGIN
  v_po_id := COALESCE(NEW.po_id, OLD.po_id);
  UPDATE public.purchase_orders SET
    total_paid = (SELECT COALESCE(SUM(amount), 0) FROM public.vendor_payments WHERE po_id = v_po_id),
    updated_at = NOW()
  WHERE id = v_po_id;
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
CREATE TRIGGER trg_update_po_payment AFTER INSERT OR DELETE ON vendor_payments
  FOR EACH ROW EXECUTE FUNCTION update_po_payment_status();

-- AUTO-UPDATE PO STATUS ON RECEIVE
CREATE OR REPLACE FUNCTION update_po_status_on_receive()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_all_received BOOLEAN;
BEGIN
  v_po_id := NEW.po_id;
  SELECT NOT EXISTS (
    SELECT 1 FROM public.po_items WHERE po_id = v_po_id AND quantity_received < quantity
  ) INTO v_all_received;
  IF v_all_received THEN
    UPDATE public.purchase_orders SET status = 'delivered'::po_status, updated_at = NOW()
    WHERE id = v_po_id AND status != 'cancelled'::po_status;
  ELSIF (SELECT SUM(quantity_received) FROM public.po_items WHERE po_id = v_po_id) > 0 THEN
    UPDATE public.purchase_orders SET status = 'partially_delivered'::po_status, updated_at = NOW()
    WHERE id = v_po_id AND status IN ('draft'::po_status, 'sent'::po_status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_po_status_receive ON material_receivings;
CREATE TRIGGER trg_update_po_status_receive AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION update_po_status_on_receive();

-- AUTO-UPDATE PO ITEMS QUANTITY RECEIVED
CREATE OR REPLACE FUNCTION update_po_item_received_qty()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.po_items SET
    quantity_received = (SELECT COALESCE(SUM(received_quantity), 0) FROM public.material_receivings WHERE po_item_id = NEW.po_item_id)
  WHERE id = NEW.po_item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_item_received ON material_receivings;
CREATE TRIGGER trg_update_item_received AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION update_po_item_received_qty();

-- SYNC MATERIALS INVENTORY ON RECEIVE
CREATE OR REPLACE FUNCTION sync_material_inventory_on_receive()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_po_item po_items%ROWTYPE;
BEGIN
  SELECT project_id INTO v_project_id FROM public.purchase_orders WHERE id = NEW.po_id;
  SELECT * INTO v_po_item FROM public.po_items WHERE id = NEW.po_item_id;
  IF EXISTS (
    SELECT 1 FROM public.materials WHERE project_id = v_project_id AND name = v_po_item.material_name AND unit = v_po_item.unit AND deleted_at IS NULL
  ) THEN
    UPDATE public.materials SET quantity_purchased = quantity_purchased + NEW.received_quantity, updated_at = NOW()
    WHERE project_id = v_project_id AND name = v_po_item.material_name AND unit = v_po_item.unit AND deleted_at IS NULL;
  ELSE
    INSERT INTO public.materials (project_id, org_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level)
    VALUES (v_project_id, NEW.org_id, v_po_item.material_name, 'Other'::material_category, NEW.received_quantity, 0, v_po_item.unit, v_po_item.unit_price,
      (SELECT business_name FROM public.vendors WHERE id = (SELECT vendor_id FROM public.purchase_orders WHERE id = NEW.po_id)), 0);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_materials ON material_receivings;
CREATE TRIGGER trg_sync_materials AFTER INSERT ON material_receivings
  FOR EACH ROW EXECUTE FUNCTION sync_material_inventory_on_receive();

-- ============================================================
-- RLS POLICIES (idempotent)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can manage all vendors' AND tablename = 'vendors') THEN
    CREATE POLICY "Org owners can manage all vendors" ON vendors FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'));
    CREATE POLICY "Engineers can manage org vendors" ON vendors FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer'));
    CREATE POLICY "Clients can view org vendors" ON vendors FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can manage all POs' AND tablename = 'purchase_orders') THEN
    CREATE POLICY "Org owners can manage all POs" ON purchase_orders FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'));
    CREATE POLICY "Engineers can manage org POs" ON purchase_orders FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer'));
    CREATE POLICY "Clients can view org POs" ON purchase_orders FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can manage all PO items' AND tablename = 'po_items') THEN
    CREATE POLICY "Org owners can manage all PO items" ON po_items FOR ALL USING (po_id IN (SELECT id FROM purchase_orders WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')));
    CREATE POLICY "Engineers can manage PO items" ON po_items FOR ALL USING (po_id IN (SELECT id FROM purchase_orders WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')));
    CREATE POLICY "Clients can view PO items" ON po_items FOR SELECT USING (po_id IN (SELECT id FROM purchase_orders WHERE org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can manage all receivings' AND tablename = 'material_receivings') THEN
    CREATE POLICY "Org owners can manage all receivings" ON material_receivings FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'));
    CREATE POLICY "Engineers can manage org receivings" ON material_receivings FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer'));
    CREATE POLICY "Clients can view org receivings" ON material_receivings FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Org owners can manage all payments' AND tablename = 'vendor_payments') THEN
    CREATE POLICY "Org owners can manage all payments" ON vendor_payments FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner'));
    CREATE POLICY "Engineers can manage org payments" ON vendor_payments FOR ALL USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer'));
    CREATE POLICY "Clients can view org payments" ON vendor_payments FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client'));
  END IF;
END $$;

-- ============================================================
-- VENDORS CRUD
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_vendors(p_org_id UUID, p_search TEXT DEFAULT NULL, p_status TEXT DEFAULT NULL)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.vendors
  WHERE org_id = get_current_user_org_id() AND deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR search_vector @@ plainto_tsquery('english', p_search))
    AND (p_status IS NULL OR p_status = '' OR status = p_status::vendor_status)
  ORDER BY business_name;
$$;

CREATE OR REPLACE FUNCTION get_vendor(p_id UUID)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.vendors
  WHERE id = p_id AND org_id = get_current_user_org_id() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION insert_vendor(
  p_business_name TEXT, p_owner_name TEXT, p_phone TEXT,
  p_alt_phone TEXT DEFAULT NULL, p_gst_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL, p_material_categories material_category[] DEFAULT '{}',
  p_payment_terms_days INTEGER DEFAULT 30, p_credit_limit DECIMAL DEFAULT 0,
  p_status TEXT DEFAULT 'active', p_notes TEXT DEFAULT NULL,
  p_org_id UUID DEFAULT NULL, p_created_by UUID DEFAULT NULL
)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.vendors (
    business_name, owner_name, phone, alt_phone, gst_number,
    address, material_categories, payment_terms_days, credit_limit,
    status, notes, org_id, created_by
  ) VALUES (
    p_business_name, p_owner_name, p_phone,
    NULLIF(p_alt_phone, ''), NULLIF(p_gst_number, ''),
    NULLIF(p_address, ''), p_material_categories,
    p_payment_terms_days, p_credit_limit,
    p_status::vendor_status, NULLIF(p_notes, ''),
    COALESCE(p_org_id, get_current_user_org_id()), p_created_by
  )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_vendor(
  p_id UUID,
  p_business_name TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_alt_phone TEXT DEFAULT NULL,
  p_gst_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_material_categories material_category[] DEFAULT NULL,
  p_payment_terms_days INTEGER DEFAULT NULL,
  p_credit_limit DECIMAL DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.vendors SET
    business_name = COALESCE(p_business_name, business_name),
    owner_name = COALESCE(p_owner_name, owner_name),
    phone = COALESCE(p_phone, phone),
    alt_phone = CASE WHEN p_alt_phone IS NOT NULL THEN NULLIF(p_alt_phone, '') ELSE alt_phone END,
    gst_number = CASE WHEN p_gst_number IS NOT NULL THEN NULLIF(p_gst_number, '') ELSE gst_number END,
    address = CASE WHEN p_address IS NOT NULL THEN NULLIF(p_address, '') ELSE address END,
    material_categories = COALESCE(p_material_categories, material_categories),
    payment_terms_days = COALESCE(p_payment_terms_days, payment_terms_days),
    credit_limit = COALESCE(p_credit_limit, credit_limit),
    status = COALESCE(p_status::vendor_status, status),
    notes = CASE WHEN p_notes IS NOT NULL THEN NULLIF(p_notes, '') ELSE notes END,
    updated_at = NOW()
  WHERE id = p_id AND org_id = get_current_user_org_id() AND deleted_at IS NULL
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_vendor(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.vendors
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION restore_vendor(p_id UUID)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.vendors SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION get_deleted_vendors(p_org_id UUID)
RETURNS SETOF vendors
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.vendors
  WHERE org_id = get_current_user_org_id() AND deleted_at IS NOT NULL
  ORDER BY deleted_at DESC;
$$;

-- ============================================================
-- PURCHASE ORDERS CRUD
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_purchase_orders(
  p_org_id UUID, p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL, p_vendor_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS SETOF purchase_orders
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT po.*,
    v.business_name AS vendor_name,
    p.name AS project_name
  FROM public.purchase_orders po
  LEFT JOIN public.vendors v ON v.id = po.vendor_id
  LEFT JOIN public.projects p ON p.id = po.project_id
  WHERE po.org_id = get_current_user_org_id() AND po.deleted_at IS NULL
    AND (p_search IS NULL OR p_search = '' OR po.search_vector @@ plainto_tsquery('english', p_search))
    AND (p_status IS NULL OR p_status = '' OR po.status = p_status::po_status)
    AND (p_vendor_id IS NULL OR po.vendor_id = p_vendor_id)
    AND (p_project_id IS NULL OR po.project_id = p_project_id)
  ORDER BY po.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_purchase_order(p_id UUID)
RETURNS SETOF purchase_orders
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT po.*,
    v.business_name AS vendor_name,
    p.name AS project_name
  FROM public.purchase_orders po
  LEFT JOIN public.vendors v ON v.id = po.vendor_id
  LEFT JOIN public.projects p ON p.id = po.project_id
  WHERE po.id = p_id AND po.org_id = get_current_user_org_id() AND po.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION get_po_items(p_po_id UUID)
RETURNS SETOF po_items
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT * FROM public.po_items WHERE po_id = p_po_id ORDER BY created_at;
$$;

CREATE OR REPLACE FUNCTION insert_purchase_order(
  p_vendor_id UUID, p_project_id UUID, p_po_date DATE,
  p_expected_delivery_date DATE DEFAULT NULL,
  p_tax_amount DECIMAL DEFAULT 0, p_transport_amount DECIMAL DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]',
  p_org_id UUID DEFAULT NULL, p_created_by UUID DEFAULT NULL
)
RETURNS SETOF purchase_orders
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_item JSONB;
  v_subtotal DECIMAL := 0;
  v_po_number TEXT;
BEGIN
  v_po_number := public.generate_po_number(COALESCE(p_org_id, get_current_user_org_id()));

  INSERT INTO public.purchase_orders (
    org_id, po_number, vendor_id, project_id, po_date,
    expected_delivery_date, tax_amount, transport_amount, notes, created_by
  ) VALUES (
    COALESCE(p_org_id, get_current_user_org_id()),
    v_po_number, p_vendor_id, p_project_id, p_po_date,
    p_expected_delivery_date, p_tax_amount, p_transport_amount,
    NULLIF(p_notes, ''), p_created_by
  ) RETURNING * INTO v_po;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.po_items (
      po_id, material_name, description, quantity, unit, unit_price
    ) VALUES (
      v_po.id,
      v_item->>'material_name',
      NULLIF(v_item->>'description', ''),
      (v_item->>'quantity')::DECIMAL,
      v_item->>'unit',
      (v_item->>'unit_price')::DECIMAL
    );
    v_subtotal := v_subtotal + ((v_item->>'quantity')::DECIMAL * (v_item->>'unit_price')::DECIMAL);
  END LOOP;

  -- Update totals
  UPDATE public.purchase_orders SET
    subtotal = v_subtotal,
    total_amount = v_subtotal + p_tax_amount + p_transport_amount,
    balance_due = v_subtotal + p_tax_amount + p_transport_amount,
    updated_at = NOW()
  WHERE id = v_po.id
  RETURNING * INTO v_po;

  RETURN NEXT v_po;
END;
$$;

CREATE OR REPLACE FUNCTION update_purchase_order(
  p_id UUID,
  p_expected_delivery_date DATE DEFAULT NULL,
  p_tax_amount DECIMAL DEFAULT NULL,
  p_transport_amount DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS SETOF purchase_orders
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.purchase_orders SET
    expected_delivery_date = COALESCE(p_expected_delivery_date, expected_delivery_date),
    tax_amount = COALESCE(p_tax_amount, tax_amount),
    transport_amount = COALESCE(p_transport_amount, transport_amount),
    notes = CASE WHEN p_notes IS NOT NULL THEN NULLIF(p_notes, '') ELSE notes END,
    status = COALESCE(p_status::po_status, status),
    total_amount = subtotal + COALESCE(p_tax_amount, tax_amount) + COALESCE(p_transport_amount, transport_amount),
    balance_due = subtotal + COALESCE(p_tax_amount, tax_amount) + COALESCE(p_transport_amount, transport_amount) - total_paid,
    updated_at = NOW()
  WHERE id = p_id AND org_id = get_current_user_org_id() AND deleted_at IS NULL
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_purchase_order(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.purchase_orders
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION restore_purchase_order(p_id UUID)
RETURNS SETOF purchase_orders
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.purchase_orders SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION cancel_purchase_order(p_id UUID)
RETURNS SETOF purchase_orders
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.purchase_orders
  SET status = 'cancelled'::po_status, updated_at = NOW()
  WHERE id = p_id AND org_id = get_current_user_org_id()
    AND deleted_at IS NULL AND status NOT IN ('delivered'::po_status, 'cancelled'::po_status)
  RETURNING *;
$$;

-- ============================================================
-- MATERIAL RECEIVING
-- ============================================================

CREATE OR REPLACE FUNCTION get_po_receivings(p_po_id UUID)
RETURNS SETOF material_receivings
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT mr.*,
    pi.material_name,
    po.po_number
  FROM public.material_receivings mr
  LEFT JOIN public.po_items pi ON pi.id = mr.po_item_id
  LEFT JOIN public.purchase_orders po ON po.id = mr.po_id
  WHERE mr.po_id = p_po_id
  ORDER BY mr.received_date DESC;
$$;

CREATE OR REPLACE FUNCTION insert_material_receiving(
  p_po_id UUID, p_po_item_id UUID, p_received_quantity DECIMAL,
  p_received_date DATE DEFAULT NULL, p_notes TEXT DEFAULT NULL,
  p_org_id UUID DEFAULT NULL, p_received_by UUID DEFAULT NULL
)
RETURNS SETOF material_receivings
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.material_receivings (
    org_id, po_id, po_item_id, received_quantity,
    received_date, received_by, notes
  ) VALUES (
    COALESCE(p_org_id, get_current_user_org_id()),
    p_po_id, p_po_item_id, p_received_quantity,
    COALESCE(p_received_date, CURRENT_DATE), p_received_by,
    NULLIF(p_notes, '')
  )
  RETURNING *;
$$;

-- ============================================================
-- VENDOR PAYMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_vendor_payments(
  p_org_id UUID, p_vendor_id UUID DEFAULT NULL,
  p_po_id UUID DEFAULT NULL
)
RETURNS SETOF vendor_payments
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT vp.*,
    po.po_number,
    v.business_name AS vendor_name
  FROM public.vendor_payments vp
  LEFT JOIN public.purchase_orders po ON po.id = vp.po_id
  LEFT JOIN public.vendors v ON v.id = vp.vendor_id
  WHERE vp.org_id = get_current_user_org_id()
    AND (p_vendor_id IS NULL OR vp.vendor_id = p_vendor_id)
    AND (p_po_id IS NULL OR vp.po_id = p_po_id)
  ORDER BY vp.payment_date DESC;
$$;

CREATE OR REPLACE FUNCTION insert_vendor_payment(
  p_po_id UUID, p_vendor_id UUID, p_amount DECIMAL,
  p_payment_date DATE DEFAULT NULL, p_payment_method TEXT,
  p_reference_number TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL,
  p_org_id UUID DEFAULT NULL, p_created_by UUID DEFAULT NULL
)
RETURNS SETOF vendor_payments
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.vendor_payments (
    org_id, po_id, vendor_id, amount, payment_date,
    payment_method, reference_number, notes, created_by
  ) VALUES (
    COALESCE(p_org_id, get_current_user_org_id()),
    p_po_id, p_vendor_id, p_amount,
    COALESCE(p_payment_date, CURRENT_DATE),
    p_payment_method::payment_method,
    NULLIF(p_reference_number, ''), NULLIF(p_notes, ''),
    p_created_by
  )
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_vendor_payment(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.vendor_payments
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

-- ============================================================
-- VENDOR LEDGER
-- ============================================================

CREATE OR REPLACE FUNCTION get_vendor_ledger(p_vendor_id UUID)
RETURNS TABLE(
  id UUID,
  date DATE,
  description TEXT,
  debit DECIMAL,
  credit DECIMAL,
  balance DECIMAL,
  "reference" TEXT,
  entry_type TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  (
    SELECT po.id, po.po_date, 'PO ' || po.po_number,
      po.total_amount, 0::DECIMAL, 0::DECIMAL,
      po.po_number, 'po'::TEXT
    FROM public.purchase_orders po
    WHERE po.vendor_id = p_vendor_id
      AND po.org_id = get_current_user_org_id()
      AND po.deleted_at IS NULL
  )
  UNION ALL
  (
    SELECT vp.id, vp.payment_date,
      'Payment via ' || vp.payment_method ||
      CASE WHEN vp.reference_number IS NOT NULL THEN ' (' || vp.reference_number || ')' ELSE '' END,
      0::DECIMAL, vp.amount, 0::DECIMAL,
      COALESCE(vp.reference_number, vp.id::TEXT), 'payment'::TEXT
    FROM public.vendor_payments vp
    WHERE vp.vendor_id = p_vendor_id
      AND vp.org_id = get_current_user_org_id()
  )
  ORDER BY date, entry_type;
$$;

-- ============================================================
-- OUTSTANDING DASHBOARD
-- ============================================================

CREATE OR REPLACE FUNCTION get_outstanding_summary(p_org_id UUID)
RETURNS TABLE(
  today_due DECIMAL,
  this_week_due DECIMAL,
  this_month_due DECIMAL,
  overdue_total DECIMAL,
  upcoming_total DECIMAL,
  total_outstanding DECIMAL,
  cash_required DECIMAL
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN po.expected_delivery_date = CURRENT_DATE AND po.balance_due > 0 THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND po.balance_due > 0 THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND po.balance_due > 0 THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.expected_delivery_date < CURRENT_DATE AND po.balance_due > 0 AND po.status != 'cancelled' THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.expected_delivery_date > CURRENT_DATE + INTERVAL '30 days' AND po.balance_due > 0 THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.balance_due > 0 AND po.status != 'cancelled' THEN po.balance_due ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN po.expected_delivery_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND po.balance_due > 0 THEN po.balance_due ELSE 0 END), 0)
  FROM public.purchase_orders po
  WHERE po.org_id = get_current_user_org_id() AND po.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION get_top_vendors(p_org_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE(
  vendor_id UUID,
  vendor_name TEXT,
  total_purchased DECIMAL,
  total_paid DECIMAL,
  balance_due DECIMAL,
  active_pos BIGINT,
  overdue_pos BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    v.id,
    v.business_name,
    COALESCE(SUM(po.total_amount), 0),
    COALESCE(SUM(po.total_paid), 0),
    COALESCE(SUM(po.balance_due), 0),
    COUNT(CASE WHEN po.status NOT IN ('delivered'::po_status, 'cancelled'::po_status) AND po.deleted_at IS NULL THEN 1 END),
    COUNT(CASE WHEN po.expected_delivery_date < CURRENT_DATE AND po.balance_due > 0 AND po.status != 'cancelled' AND po.deleted_at IS NULL THEN 1 END)
  FROM public.vendors v
  LEFT JOIN public.purchase_orders po ON po.vendor_id = v.id AND po.deleted_at IS NULL
  WHERE v.org_id = get_current_user_org_id() AND v.deleted_at IS NULL
  GROUP BY v.id, v.business_name
  ORDER BY COALESCE(SUM(po.balance_due), 0) DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- EXPENSE INTEGRATION: Get payment-based expenses
-- ============================================================

CREATE OR REPLACE FUNCTION get_vendor_expenses(p_org_id UUID, p_since DATE DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  amount DECIMAL,
  category TEXT,
  vendor TEXT,
  description TEXT,
  date DATE,
  created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT vp.id, vp.amount, 'Miscellaneous'::TEXT, v.business_name,
    'Payment to ' || v.business_name || ' for PO ' || po.po_number,
    vp.payment_date, vp.created_at
  FROM public.vendor_payments vp
  LEFT JOIN public.vendors v ON v.id = vp.vendor_id
  LEFT JOIN public.purchase_orders po ON po.id = vp.po_id
  WHERE vp.org_id = get_current_user_org_id()
    AND (p_since IS NULL OR vp.payment_date >= p_since)
  ORDER BY vp.payment_date DESC;
$$;

-- ============================================================
-- SEARCH: Global search across vendors, POs
-- ============================================================

CREATE OR REPLACE FUNCTION search_vendors_and_pos(p_org_id UUID, p_query TEXT)
RETURNS TABLE(
  entity_type TEXT,
  id UUID,
  title TEXT,
  subtitle TEXT,
  metadata JSONB
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  (
    SELECT 'vendor'::TEXT, v.id, v.business_name,
      v.owner_name || ' | ' || v.phone,
      jsonb_build_object('status', v.status, 'phone', v.phone)
    FROM public.vendors v
    WHERE v.org_id = get_current_user_org_id() AND v.deleted_at IS NULL
      AND (p_query = '' OR v.search_vector @@ plainto_tsquery('english', p_query))
  )
  UNION ALL
  (
    SELECT 'purchase_order'::TEXT, po.id, po.po_number,
      v.business_name || ' | ₹' || po.total_amount::TEXT,
      jsonb_build_object('status', po.status, 'vendor', v.business_name, 'total', po.total_amount)
    FROM public.purchase_orders po
    LEFT JOIN public.vendors v ON v.id = po.vendor_id
    WHERE po.org_id = get_current_user_org_id() AND po.deleted_at IS NULL
      AND (p_query = '' OR po.search_vector @@ plainto_tsquery('english', p_query))
  )
  ORDER BY title
  LIMIT 20;
$$;

-- ============================================================
-- GRANT EXECUTE to all roles
-- ============================================================
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO anon, authenticated', fn.proname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE vendors; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE po_items; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE material_receivings; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE vendor_payments; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
