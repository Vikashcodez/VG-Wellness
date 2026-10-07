-- ============================================================================
-- SAAS MULTI-TENANT ISOLATION: ADD ORGANIZATION_ID & BRANCH_ID ACROSS ALL ENTITIES
-- ============================================================================

-- 1. Clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Practitioners
ALTER TABLE practitioners 
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Service Categories & Services
ALTER TABLE service_categories
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Packages & Membership Plans
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 5. Product Categories, Brands & Products
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE product_brands
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;

-- 6. Suppliers, Stock, Locations & Transactions
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE inventory_locations
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE inventory_stock
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE stock_adjustments
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 7. Appointments & Care Engine
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE wellness_assessments
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE wellness_goals
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE wellness_plans
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

-- 8. Invoices, Payments, Orders & Cart
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE carts
ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id) ON DELETE SET NULL;

-- ============================================================================
-- BACKFILL EXISTING DATA TO RESPECTIVE ORGANIZATIONS
-- ============================================================================

-- Backfill from branch_id if available
UPDATE clients c SET organization_id = b.organization_id FROM branches b WHERE c.branch_id = b.id AND c.organization_id IS NULL;
UPDATE practitioners p SET organization_id = b.organization_id FROM branches b WHERE p.branch_id = b.id AND p.organization_id IS NULL;
UPDATE services s SET organization_id = b.organization_id FROM branches b WHERE s.branch_id = b.id AND s.organization_id IS NULL;
UPDATE packages pkg SET organization_id = b.organization_id FROM branches b WHERE pkg.branch_id = b.id AND pkg.organization_id IS NULL;
UPDATE membership_plans mp SET organization_id = b.organization_id FROM branches b WHERE mp.branch_id = b.id AND mp.organization_id IS NULL;
UPDATE suppliers sup SET organization_id = b.organization_id FROM branches b WHERE sup.branch_id = b.id AND sup.organization_id IS NULL;
UPDATE inventory_locations il SET organization_id = b.organization_id FROM branches b WHERE il.branch_id = b.id AND il.organization_id IS NULL;
UPDATE inventory_stock st SET organization_id = b.organization_id FROM branches b WHERE st.branch_id = b.id AND st.organization_id IS NULL;
UPDATE inventory_transactions it SET organization_id = b.organization_id FROM branches b WHERE it.branch_id = b.id AND it.organization_id IS NULL;
UPDATE stock_adjustments sa SET organization_id = b.organization_id FROM branches b WHERE sa.branch_id = b.id AND sa.organization_id IS NULL;
UPDATE appointments a SET organization_id = b.organization_id FROM branches b WHERE a.branch_id = b.id AND a.organization_id IS NULL;
UPDATE wellness_assessments wa SET organization_id = b.organization_id FROM branches b WHERE wa.branch_id = b.id AND wa.organization_id IS NULL;
UPDATE wellness_goals wg SET organization_id = b.organization_id FROM branches b WHERE wg.branch_id = b.id AND wg.organization_id IS NULL;
UPDATE wellness_plans wp SET organization_id = b.organization_id FROM branches b WHERE wp.branch_id = b.id AND wp.organization_id IS NULL;
UPDATE invoices inv SET organization_id = b.organization_id FROM branches b WHERE inv.branch_id = b.id AND inv.organization_id IS NULL;
UPDATE payments pay SET organization_id = b.organization_id FROM branches b WHERE pay.branch_id = b.id AND pay.organization_id IS NULL;
UPDATE orders o SET organization_id = b.organization_id FROM branches b WHERE o.branch_id = b.id AND o.organization_id IS NULL;

-- Fallback any remaining NULL organization_ids to 1 (Default Flagship Organization)
UPDATE clients SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE practitioners SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE service_categories SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE services SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE packages SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE membership_plans SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE product_categories SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE product_brands SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE products SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE suppliers SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE inventory_locations SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE inventory_stock SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE inventory_transactions SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE stock_adjustments SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE appointments SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE wellness_assessments SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE wellness_goals SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE wellness_plans SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE payments SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE orders SET organization_id = 1 WHERE organization_id IS NULL;
UPDATE carts SET organization_id = 1 WHERE organization_id IS NULL;

-- Ensure branch_id defaults to 1 if null for branch-specific operational records
UPDATE clients SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE practitioners SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE services SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE products SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE appointments SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE invoices SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE payments SET branch_id = 1 WHERE branch_id IS NULL;

-- ============================================================================
-- PERFORMANCE & ISOLATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_branch ON clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_org ON practitioners(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_packages_org ON packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_org ON inventory_stock(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch ON appointments(branch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_goals_org ON wellness_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_wellness_plans_org ON wellness_plans(organization_id);
