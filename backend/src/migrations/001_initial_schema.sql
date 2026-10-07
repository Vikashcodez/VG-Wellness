-- ============================================================================
-- WELLNESS CENTRE MANAGEMENT SYSTEM - INITIAL SCHEMA MIGRATION
-- ============================================================================

-- Organizations & Branches
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Users & User Roles
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Clients & Client Details
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(20),
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    profile_photo TEXT,
    preferred_language VARCHAR(50) DEFAULT 'English',
    medical_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_addresses (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS client_emergency_contacts (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    contact_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100),
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255)
);

-- Practitioners & Availability
CREATE TABLE IF NOT EXISTS practitioners (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    qualification VARCHAR(255),
    experience_years INT DEFAULT 0,
    license_number VARCHAR(100),
    bio TEXT,
    profile_photo TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practitioner_specializations (
    id SERIAL PRIMARY KEY,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE CASCADE,
    specialization VARCHAR(150) NOT NULL
);

-- Services
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES service_categories(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    is_online BOOLEAN DEFAULT FALSE,
    room_required BOOLEAN DEFAULT TRUE,
    practitioner_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practitioner_services (
    id SERIAL PRIMARY KEY,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(practitioner_id, service_id)
);

CREATE TABLE IF NOT EXISTS practitioner_availability (
    id SERIAL PRIMARY KEY,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 60,
    is_available BOOLEAN DEFAULT TRUE
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    service_id INT REFERENCES services(id) ON DELETE RESTRICT,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'BOOKED', -- BOOKED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
    booking_source VARCHAR(50) DEFAULT 'CLIENT_PORTAL', -- ADMIN, RECEPTION, CLIENT_PORTAL, PHONE, WALK_IN
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_status_history (
    id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_notes (
    id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wellness Assessment
CREATE TABLE IF NOT EXISTS wellness_assessments (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE SET NULL,
    appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight NUMERIC(6, 2),
    height NUMERIC(6, 2),
    bmi NUMERIC(5, 2),
    body_fat_pct NUMERIC(5, 2),
    muscle_mass_kg NUMERIC(6, 2),
    waist_circumference_cm NUMERIC(6, 2),
    water_intake_l NUMERIC(4, 2),
    sleep_hours NUMERIC(4, 2),
    exercise_freq_weekly INT,
    stress_level VARCHAR(50), -- LOW, MODERATE, HIGH, SEVERE
    lifestyle_notes TEXT,
    nutrition_notes TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wellness_assessment_metrics (
    id SERIAL PRIMARY KEY,
    assessment_id INT REFERENCES wellness_assessments(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50),
    notes TEXT
);

-- Generic Goal Engine
CREATE TABLE IF NOT EXISTS goal_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS goal_types (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES goal_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    default_metric VARCHAR(100) NOT NULL,
    default_unit VARCHAR(50) NOT NULL,
    target_direction VARCHAR(50) NOT NULL DEFAULT 'DECREASE', -- INCREASE, DECREASE, MAINTAIN, ACHIEVE
    value_type VARCHAR(50) NOT NULL DEFAULT 'DECIMAL' -- NUMBER, DECIMAL, PERCENTAGE, COUNT, DURATION, BOOLEAN, RANGE
);

CREATE TABLE IF NOT EXISTS wellness_goals (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE SET NULL,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    goal_type_id INT REFERENCES goal_types(id) ON DELETE SET NULL,
    goal_name VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ON_TRACK, AT_RISK, ACHIEVED, PAUSED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_target_date CHECK (target_date >= start_date)
);

CREATE TABLE IF NOT EXISTS goal_targets (
    id SERIAL PRIMARY KEY,
    goal_id INT REFERENCES wellness_goals(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    starting_value NUMERIC(10, 2) NOT NULL,
    current_value NUMERIC(10, 2) NOT NULL,
    target_value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    direction VARCHAR(50) NOT NULL DEFAULT 'DECREASE', -- INCREASE, DECREASE, MAINTAIN, ACHIEVE
    value_type VARCHAR(50) DEFAULT 'DECIMAL',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_milestones (
    id SERIAL PRIMARY KEY,
    goal_id INT REFERENCES wellness_goals(id) ON DELETE CASCADE,
    sequence_order INT DEFAULT 1,
    target_value NUMERIC(10, 2) NOT NULL,
    target_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACTIVE, ACHIEVED, MISSED, SKIPPED
    achieved_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_measurements (
    id SERIAL PRIMARY KEY,
    goal_id INT REFERENCES wellness_goals(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    recorded_value NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goal_status_history (
    id SERIAL PRIMARY KEY,
    goal_id INT REFERENCES wellness_goals(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wellness Plans
CREATE TABLE IF NOT EXISTS wellness_plans (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_weeks INT NOT NULL DEFAULT 4,
    price NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wellness_plan_goals (
    id SERIAL PRIMARY KEY,
    wellness_plan_id INT REFERENCES wellness_plans(id) ON DELETE CASCADE,
    goal_type_id INT REFERENCES goal_types(id) ON DELETE SET NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS wellness_plan_services (
    id SERIAL PRIMARY KEY,
    wellness_plan_id INT REFERENCES wellness_plans(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    sessions_count INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wellness_plan_activities (
    id SERIAL PRIMARY KEY,
    wellness_plan_id INT REFERENCES wellness_plans(id) ON DELETE CASCADE,
    activity_name VARCHAR(150) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_minutes INT DEFAULT 30,
    instructions TEXT
);

CREATE TABLE IF NOT EXISTS client_wellness_plans (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    wellness_plan_id INT REFERENCES wellness_plans(id) ON DELETE SET NULL,
    goal_id INT REFERENCES wellness_goals(id) ON DELETE SET NULL,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, PAUSED, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Packages & Memberships
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INT DEFAULT 30,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_services (
    id SERIAL PRIMARY KEY,
    package_id INT REFERENCES packages(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    sessions_count INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS client_packages (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    package_id INT REFERENCES packages(id) ON DELETE CASCADE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    total_sessions INT NOT NULL,
    used_sessions INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CONSUMED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_usage (
    id SERIAL PRIMARY KEY,
    client_package_id INT REFERENCES client_packages(id) ON DELETE CASCADE,
    appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    tier VARCHAR(50) NOT NULL, -- SILVER, GOLD, PLATINUM
    duration_months INT DEFAULT 12,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    benefits_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_memberships (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    membership_plan_id INT REFERENCES membership_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    renewal_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, CANCELLED
    discount_percent NUMERIC(5, 2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE IF NOT EXISTS activity_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    default_unit VARCHAR(50) DEFAULT 'minutes',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS client_activities (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    activity_id INT REFERENCES activity_master(id) ON DELETE CASCADE,
    target_daily NUMERIC(8, 2),
    unit VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    activity_id INT REFERENCES activity_master(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT,
    count_value NUMERIC(8, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products, Brands, Categories, Variants, Inventory
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS product_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES product_categories(id) ON DELETE SET NULL,
    brand_id INT REFERENCES product_brands(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    additional_price NUMERIC(12, 2) DEFAULT 0.00,
    barcode VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    practitioner_id INT REFERENCES practitioners(id) ON DELETE SET NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    dosage_notes TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, PURCHASED, DISMISSED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers & Inventory Stock
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    gst_tax_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE RESTRICT,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RECEIVED, CANCELLED
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_locations (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS inventory_stock (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE,
    quantity INT NOT NULL DEFAULT 0,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location_id INT REFERENCES inventory_locations(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_stock_qty CHECK (quantity >= 0)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE, SALE, RETURN, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, DAMAGE, EXPIRY
    quantity INT NOT NULL,
    batch_number VARCHAR(100),
    reference_id INT,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(50) NOT NULL, -- INCREASE, DECREASE
    quantity INT NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart & Orders (E-commerce)
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, PAID, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED, REFUNDED
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- UNPAID, PAID, PARTIAL, REFUNDED
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Billing & Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ISSUED', -- DRAFT, ISSUED, PARTIAL, PAID, CANCELLED, REFUNDED
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- SERVICE, PRODUCT, PACKAGE, MEMBERSHIP, CONSULTATION, MISCELLANEOUS
    reference_id INT,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    invoice_id INT REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- CASH, CARD, UPI, NET_BANKING, ONLINE_GATEWAY, WALLET
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_reference VARCHAR(150),
    notes TEXT,
    received_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_id INT REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id INT REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    processed_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications & Audit Logs
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ALERT
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Helpful Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_wellness_goals_client ON wellness_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_goal_measurements_goal ON goal_measurements(goal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_prod ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
