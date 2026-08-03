-- ============================================================
-- FIX: Budget alerts trigger — add org_id, prevent division by zero, deduplicate
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop old triggers first
DROP TRIGGER IF EXISTS on_expense_created ON expenses;
DROP TRIGGER IF EXISTS on_material_updated ON materials;

-- Fixed budget alerts trigger
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
  project_budget DECIMAL;
  project_spent DECIMAL;
  spend_percentage DECIMAL;
  proj_org_id UUID;
BEGIN
  -- Get project budget and org_id
  SELECT budget, org_id INTO project_budget, proj_org_id
  FROM projects WHERE id = NEW.project_id;

  -- Skip if budget is 0 or null (avoid division by zero)
  IF project_budget IS NULL OR project_budget <= 0 THEN
    UPDATE projects SET spent = (
      SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE project_id = NEW.project_id
    ) WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;

  -- Calculate total spent
  SELECT COALESCE(SUM(amount), 0) INTO project_spent
  FROM expenses WHERE project_id = NEW.project_id;

  -- Calculate percentage
  spend_percentage := (project_spent / project_budget) * 100;

  -- Update project spent amount
  UPDATE projects SET spent = project_spent WHERE id = NEW.project_id;

  -- Create alerts only if one doesn't already exist at this threshold for this project
  IF spend_percentage >= 100 THEN
    INSERT INTO budget_alerts (project_id, org_id, alert_type, threshold_percentage, message)
    SELECT NEW.project_id, proj_org_id, 'budget_exceeded', 100, 'Budget has been exceeded!'
    WHERE NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE project_id = NEW.project_id AND alert_type = 'budget_exceeded'
    );
  ELSIF spend_percentage >= 90 THEN
    INSERT INTO budget_alerts (project_id, org_id, alert_type, threshold_percentage, message)
    SELECT NEW.project_id, proj_org_id, 'budget_90', 90, 'Budget usage has reached 90%!'
    WHERE NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE project_id = NEW.project_id AND alert_type = 'budget_90'
    );
  ELSIF spend_percentage >= 70 THEN
    INSERT INTO budget_alerts (project_id, org_id, alert_type, threshold_percentage, message)
    SELECT NEW.project_id, proj_org_id, 'budget_70', 70, 'Budget usage has reached 70%'
    WHERE NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE project_id = NEW.project_id AND alert_type = 'budget_70'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_expense_created
  AFTER INSERT ON expenses
  FOR EACH ROW EXECUTE FUNCTION check_budget_alerts();

-- Fixed material stock check trigger
CREATE OR REPLACE FUNCTION check_material_stock()
RETURNS TRIGGER AS $$
DECLARE
  proj_org_id UUID;
BEGIN
  IF NEW.quantity_remaining <= NEW.reorder_level AND NEW.reorder_level > 0 THEN
    SELECT org_id INTO proj_org_id FROM projects WHERE id = NEW.project_id;
    INSERT INTO budget_alerts (project_id, org_id, alert_type, threshold_percentage, message)
    SELECT NEW.project_id, proj_org_id, 'low_stock', 0,
            NEW.name || ' stock is low! Remaining: ' || NEW.quantity_remaining || ' ' || NEW.unit
    WHERE NOT EXISTS (
      SELECT 1 FROM budget_alerts
      WHERE project_id = NEW.project_id AND alert_type = 'low_stock'
        AND message LIKE NEW.name || '%'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_material_updated
  AFTER UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION check_material_stock();
