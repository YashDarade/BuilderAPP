-- ============================================================
-- MIGRATION 033: VENDOR MANAGEMENT RPC FUNCTIONS
-- ============================================================

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
    AND (p_status IS NULL OR p_status = '' OR status = p_status)
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
    AND (p_status IS NULL OR p_status = '' OR po.status = p_status)
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
