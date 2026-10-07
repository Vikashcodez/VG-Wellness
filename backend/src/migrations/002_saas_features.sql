-- ============================================================================
-- SAAS MULTI-TENANCY, ASSETS MANAGEMENT, FINANCE & EMPLOYEES MIGRATION
-- ============================================================================

-- 1. Enhance organizations table for SaaS Multi-Tenancy
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'PRO',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS max_branches INT DEFAULT 5,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '365 days'),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100) DEFAULT 'GSTIN-29AABCU9603R1ZM',
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS admin_user_id INT REFERENCES users(id) ON DELETE SET NULL;

-- 2. Enhance branches table
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS branch_admin_id INT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100) DEFAULT '07:00 AM - 09:00 PM';

-- 3. Additional SaaS roles
INSERT INTO roles (name, description, is_system)
VALUES 
  ('CENTRE_ADMIN', 'Wellness Centre Tenant Administrator', true),
  ('BRANCH_ADMIN', 'Branch Operational Administrator', true),
  ('ACCOUNTANT', 'Finance & Accounting Lead', true),
  ('EMPLOYEE', 'General Centre Staff Member', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Employees Master Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL, -- CLINICAL, THERAPY, FRONT_OFFICE, ACCOUNTS, INVENTORY, MANAGEMENT, SUPPORT
    designation VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, ON_LEAVE
    emergency_contact VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);

-- 5. Complete Asset Management Module
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- THERAPY_EQUIPMENT, DIAGNOSTIC, WELLNESS_MACHINE, IT_HARDWARE, FURNITURE, FACILITY
    serial_number VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    purchase_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location_room VARCHAR(100),
    status VARCHAR(50) DEFAULT 'OPERATIONAL', -- OPERATIONAL, UNDER_MAINTENANCE, REPAIR_NEEDED, RETIRED
    vendor_name VARCHAR(255),
    warranty_expiry DATE,
    last_serviced_date DATE,
    next_service_date DATE,
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_branch ON assets(branch_id);

CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
    id SERIAL PRIMARY KEY,
    asset_id INT REFERENCES assets(id) ON DELETE CASCADE,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    maintenance_type VARCHAR(100) NOT NULL, -- PREVENTIVE, CALIBRATION, REPAIR, INSPECTION
    cost NUMERIC(12, 2) DEFAULT 0.00,
    performed_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_logs ON asset_maintenance_logs(asset_id);

-- 6. Accounts & Finance Module
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    expense_code VARCHAR(50) UNIQUE NOT NULL,
    category_id INT REFERENCES expense_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER', -- BANK_TRANSFER, UPI, CASH, CREDIT_CARD, CHEQUE
    vendor_payee VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(payment_date);

-- Ensure default organization has slug
UPDATE organizations SET slug = 'aura-life', plan_type = 'ENTERPRISE', status = 'ACTIVE' WHERE code = 'AURA-LIFE';
