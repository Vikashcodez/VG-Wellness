# Aura Life Wellness Centre Management System

A production-grade, modular, scalable Full-Stack Wellness Centre and Hospital Management System featuring an Express.js + PostgreSQL backend API, a comprehensive Staff & Hospital Admin application, and a responsive mobile-first Client Portal.

---

## 🏛️ System Architecture

```text
wellness-centre/
│
├── frontend/       → Hospital / Wellness Centre Staff & Admin application (React.js + Vite + Tailwind CSS)
│                     Port: 5173
│
├── client/         → Client Portal application (React.js + Vite + Tailwind CSS)
│                     Port: 5174
│
└── backend/        → Express.js (ES Modules) + PostgreSQL (pg pool) REST API
                      Port: 5000
```

Both frontend applications communicate with the **same unified Express backend**, which enforces strict database integrity and Role-Based Access Control (RBAC).

---

## 🚀 Technology Stack

### Backend (`backend/`)
- **Runtime:** Node.js (v20+ / v24) with **ES Modules (`import/export`)**
- **Web Framework:** Express.js
- **Database Engine:** PostgreSQL (tested on PostgreSQL 18.1)
- **Database Driver:** `pg` (PostgreSQL Connection Pooling with transactions)
- **Security:** JWT Authentication, bcrypt password hashing, Helmet, CORS
- **Logging & Audits:** Morgan, custom central audit logger (`audit_logs` table)
- **Error Handling:** Centralized error-handling middleware

### Staff & Admin Application (`frontend/`)
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS + custom design system
- **Routing:** React Router v6
- **HTTP Client:** Centralized Axios client (`frontend/src/services/api.js`)
- **State Management:** React Context API (`AuthContext`)
- **UI Components:** Reusable modals, status badges, analytics cards, tabular layouts, responsive sidebar

### Client Portal (`client/`)
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS (Mobile-First responsive architecture)
- **Routing:** React Router v6
- **HTTP Client:** Centralized Axios client (`client/src/services/api.js`)
- **State Management:** React Context API (`ClientAuthContext`, `CartContext`)

---

## 🔐 User Roles & Role-Based Access Control (RBAC)

The system implements 10 distinct operational roles:
1. `SUPER_ADMIN` — Universal administrative control across all organizations and branches.
2. `ADMIN` — Centre administrator; manages branch operations, staff, products, and services.
3. `MANAGER` — Operations management, inventory oversight, and staff scheduling.
4. `RECEPTIONIST` — Front desk arrivals, walk-ins, calendar booking, check-in queue management.
5. `PRACTITIONER` — Wellness doctors & physicians; conducts clinical assessments, assigns plans and goals.
6. `NUTRITIONIST` — Diet and macronutrient planning, metabolic weight tracking, product prescriptions.
7. `THERAPIST` — Yoga therapy, physiotherapy, and restorative bodywork sessions.
8. `BILLING_STAFF` — Accounts, multi-item invoice generation, payment collections, and refunds.
9. `INVENTORY_STAFF` — Batch-level inventory stock, purchase orders, adjustments, and expiry tracking.
10. `CLIENT` — Centre clients accessing their personal wellness portal.

---

## 🔑 Pre-Configured Demo Accounts

All demo accounts are seeded automatically and ready for immediate testing:

| Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@wellness.com` | `admin123` | Full Staff Portal Access |
| **Receptionist** | `reception@wellness.com` | `password123` | Check-in Queue & Booking |
| **Practitioner (MD)** | `dr.sharma@wellness.com` | `password123` | Biometric Assessments & Rx |
| **Nutritionist** | `nutritionist@wellness.com` | `password123` | Goal Engine & Diet Plans |
| **Therapist** | `therapist@wellness.com` | `password123` | Yoga & Bodywork Sessions |
| **Billing Staff** | `billing@wellness.com` | `password123` | Invoices & Payment Ledger |
| **Inventory Staff** | `inventory@wellness.com` | `password123` | Stock Batches & Adjustments |
| **Demo Client** | `rahul@example.com` | `client123` | **Client Portal User** |

---

## 📊 Generic Goal Engine Architecture

Rather than hardcoding weight loss, the system utilizes a **universal goal model**:
- **Goal Archetypes:** Weight Loss, Weight Gain, Muscle Gain, Body Fat %, Daily Hydration, Sleep Improvement, Daily Steps, Meditation, Stress Reduction.
- **Target Directions:** `DECREASE`, `INCREASE`, `MAINTAIN`, `ACHIEVE`.
- **Mathematical Formulations:**
  - For **DECREASE**:
    $$\text{Progress} = \frac{\text{Starting} - \text{Current}}{\text{Starting} - \text{Target}} \times 100\%$$
  - For **INCREASE**:
    $$\text{Progress} = \frac{\text{Current} - \text{Starting}}{\text{Target} - \text{Starting}} \times 100\%$$
- **Milestone Engine:** Automatic or custom milestones with automatic progression (`ACHIEVED`, `ACTIVE`, `PENDING`).
- **Audit-Compliant Measurement Logs:** Prior measurements are **never overwritten**; every reading adds a historical row in `goal_measurements` and updates current metrics.

---

## ⚙️ Installation & Database Setup Instructions

### 1. PostgreSQL Database Setup
Ensure PostgreSQL is running locally on port `5432`. Create the database:
```sql
CREATE DATABASE wellness_db;
```

### 2. Configure Backend `.env`
Create `wellness-centre/backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:1320@localhost:5432/wellness_db
JWT_SECRET=wellness_super_secret_jwt_key_2026_xyz!
CLIENT_URL=http://localhost:5174
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run Migrations and Seeders
In `wellness-centre/backend`:
```bash
npm install
npm run migrate
npm run seed
```
This executes `001_initial_schema.sql` creating all 40+ tables with constraints, indexes, and populates comprehensive demo clients, practitioners, services, products, and initial journey records.

### 4. Start the Applications

#### Terminal 1 — Backend API:
```bash
cd wellness-centre/backend
npm start
# Runs on http://localhost:5000
```

#### Terminal 2 — Staff & Admin Portal:
```bash
cd wellness-centre/frontend
npm run dev
# Runs on http://localhost:5173
```

#### Terminal 3 — Client Portal:
```bash
cd wellness-centre/client
npm run dev
# Runs on http://localhost:5174
```

---

## 🌐 API Documentation Summary

### Authentication & RBAC (`/api/auth`)
- `POST /api/auth/login` — Authenticate staff or client, returns JWT token and user profile
- `POST /api/auth/register` — Self-register client account from client portal
- `GET /api/auth/me` — Get authenticated user details and associated client/practitioner records

### Clients (`/api/clients`)
- `GET /api/clients` — Search, filter, and paginate client records
- `POST /api/clients` — Register new client with primary address & emergency contacts
- `GET /api/clients/:id` — Full 15-tab client profile aggregator
- `GET /api/clients/me/profile` — Client portal profile data

### Appointments (`/api/appointments`)
- `GET /api/appointments` — Filter appointments by date range, practitioner, client, status
- `GET /api/appointments/availability` — Check practitioner slot availability and prevent double-booking
- `GET /api/appointments/queue` — Live front-desk reception arrival queue
- `POST /api/appointments` — Schedule new consultation/session
- `PATCH /api/appointments/:id/status` — Advance status (`BOOKED` → `CONFIRMED` → `CHECKED_IN` → `IN_PROGRESS` → `COMPLETED`)
- `PATCH /api/appointments/:id/reschedule` — Conflict-checked rescheduling

### Goal Engine (`/api/goals`)
- `GET /api/goals/meta` — Goal categories and archetypes
- `GET /api/goals?clientId=...` — Client goals with computed progress and milestones
- `POST /api/goals` — Create generic goal with target direction and milestones
- `POST /api/goals/:id/measurements` — Log historical measurement, updates target & milestone triggers
- `PATCH /api/goals/:id/milestones/:milestoneId` — Update milestone checkpoint

### Products & Inventory (`/api/products`, `/api/inventory`)
- `GET /api/products` — Product catalog with active stock balances
- `GET /api/products/recommendations` — Practitioner prescribed products for client
- `POST /api/products/recommendations` — Practitioner prescribes product with clinical rationale
- `GET /api/inventory/stock` — Batch-level inventory stock with expiry dates
- `POST /api/inventory/adjust` — Inventory increase/decrease adjustments with audit trail
- `GET /api/inventory/transactions` — Historical inventory ledger

### Cart & Orders (`/api/cart`, `/api/orders`)
- `GET /api/cart` — Client shopping cart with real-time tax & total calculation
- `POST /api/cart/items` — Add product to cart
- `PUT /api/cart/items` — Update item quantity or remove item
- `POST /api/orders/checkout` — Checkout order, verify stock, deduct inventory, generate invoice & receipt
- `GET /api/orders` — Orders history and dispatch tracking

### Billing & Payments (`/api/billing`)
- `GET /api/billing/invoices` — Invoices list with status filter
- `GET /api/billing/invoices/:id` — Detailed invoice breakdown with line items and payment allocations
- `POST /api/billing/invoices` — Create multi-item invoice (services, products, packages, memberships)
- `POST /api/billing/invoices/:id/payments` — Record partial/full payment, allocate to invoice, issue receipt
- `POST /api/billing/refunds` — Process full/partial refund and adjust ledger

### Reports (`/api/reports`)
- `GET /api/reports?type=revenue|appointments|goals|inventory|outstanding` — Analytics data
- `GET /api/reports?type=...&exportCsv=true` — Real-time CSV file export

---

## 🔄 End-to-End User Journey Verification

The system validates the complete workflow specified in Section 51:
1. **Branch, Practitioner, Services & Products Configured** via Postgres seed and Admin dashboard.
2. **Client Registration:** Rahul Sharma registered with `WC-2026-001`.
3. **Client Booking:** Books Consultation via Client Portal with slot conflict validation.
4. **Reception Check-in:** Front desk transitions status to `CHECKED_IN`.
5. **Practitioner Session & Assessment:** Dr. Sharma records biometric diagnostic scan (85.0 kg, BMI 27.76, 28% Body Fat).
6. **Goal Setting:** 85 kg → 72 kg Weight Loss Goal established with 4 progressive milestones.
7. **Wellness Plan Assigned:** 12-Week Weight Loss & Metabolic Vitality Plan assigned.
8. **Product Recommendation:** Nutritionist prescribes *Aura Slim Herbal Tea* and *Plant Protein*.
9. **E-Commerce Purchase:** Client adds recommended products to Cart, completes Checkout; stock automatically deducted and invoice generated.
10. **Progress Tracking:** Client logs weekly measurement (82.4 kg); Milestone 1 (82.0 kg) marked `ACHIEVED` and visual progress displays 20% on track!
