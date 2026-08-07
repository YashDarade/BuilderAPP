-- Migration 034: Update insert_purchase_order to accept optional upfront payment

-- Update insert_purchase_order to support upfront payment at PO creation
CREATE OR REPLACE FUNCTION insert_purchase_order(
  p_vendor_id UUID, p_project_id UUID, p_po_date DATE,
  p_expected_delivery_date DATE DEFAULT NULL,
  p_tax_amount DECIMAL DEFAULT 0, p_transport_amount DECIMAL DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]',
  p_org_id UUID DEFAULT NULL, p_created_by UUID DEFAULT NULL,
  p_payment_amount DECIMAL DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS SETOF purchase_orders
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_po purchase_orders%ROWTYPE;
  v_item JSONB;
  v_subtotal DECIMAL := 0;
  v_po_number TEXT;
  v_org_id UUID;
BEGIN
  v_org_id := COALESCE(p_org_id, get_current_user_org_id());
  v_po_number := public.generate_po_number(v_org_id);

  INSERT INTO public.purchase_orders (
    org_id, po_number, vendor_id, project_id, po_date,
    expected_delivery_date, tax_amount, transport_amount, notes, created_by
  ) VALUES (
    v_org_id,
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

  -- Record upfront payment if provided
  IF p_payment_amount IS NOT NULL AND p_payment_amount > 0 AND p_payment_method IS NOT NULL THEN
    INSERT INTO public.vendor_payments (
      org_id, po_id, vendor_id, amount, payment_date,
      payment_method, reference_number, created_by
    ) VALUES (
      v_org_id, v_po.id, p_vendor_id, p_payment_amount,
      COALESCE(p_po_date, CURRENT_DATE),
      p_payment_method::payment_method,
      NULLIF(p_payment_reference, ''),
      p_created_by
    );

    -- Recalculate totals after payment
    UPDATE public.purchase_orders SET
      total_paid = p_payment_amount,
      balance_due = total_amount - p_payment_amount,
      payment_status = CASE
        WHEN p_payment_amount >= total_amount THEN 'paid'::payment_status
        ELSE 'partial'::payment_status
      END,
      updated_at = NOW()
    WHERE id = v_po.id
    RETURNING * INTO v_po;
  END IF;

  RETURN NEXT v_po;
END;
$$;
