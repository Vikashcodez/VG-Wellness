const API = "http://localhost:5000/api";

async function request(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTenantIsolationTests() {
  console.log("===============================================================================");
  console.log("   AUTOMATED MULTI-TENANT ISOLATION SUITE: WELLNESS CENTRE DATA BOUNDARIES    ");
  console.log("===============================================================================");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testsFailed++;
    }
  }

  // 1. Login as Super Admin (Org 1, Super User)
  console.log("\n[TEST 1] Authenticate Super Admin...");
  const superLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@wellness.com", password: "admin123" }
  });
  assert(superLogin.status === 200, "Super Admin login succeeds");
  const superToken = superLogin.data.data.token;

  // 2. Login as Org 1 Receptionist (Org 1 Staff)
  console.log("\n[TEST 2] Authenticate Org 1 Staff (Aura Life Flagship)...");
  const org1Login = await request("/auth/login", {
    method: "POST",
    body: { email: "reception@wellness.com", password: "password123" }
  });
  assert(org1Login.status === 200, "Org 1 Staff login succeeds");
  const org1Token = org1Login.data.data.token;
  assert(org1Login.data.data.user.organizationId === 1, "Org 1 Staff is scoped to Organization ID 1");

  // 3. Login as Org 2 Centre Admin (Prana Retreat)
  console.log("\n[TEST 3] Authenticate Org 2 Centre Admin (Prana Health Retreat)...");
  const org2Login = await request("/auth/login", {
    method: "POST",
    body: { email: "prana.admin@wellness.com", password: "admin123" }
  });
  assert(org2Login.status === 200, "Org 2 Centre Admin login succeeds");
  const org2Token = org2Login.data.data.token;
  assert(org2Login.data.data.user.organizationId === 2, "Org 2 Centre Admin is scoped to Organization ID 2");

  // 4. Verify Org 2 cannot see Org 1 Clients
  console.log("\n[TEST 4] Verify Client Data Isolation...");
  const org1Clients = (await request("/clients", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Clients = (await request("/clients", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Clients.data.length} client(s). Org 2 sees ${org2Clients.data.length} client(s).`);
  assert(org1Clients.data.length > 0, "Org 1 has at least 1 client");
  const hasLeakedClient = org2Clients.data.some(c => c.organization_id === 1);
  assert(!hasLeakedClient, "Org 2 CANNOT see any clients belonging to Org 1");

  // 5. Verify Cross-Tenant Direct Resource Access Protection (Org 2 trying to access Org 1 Client by ID)
  console.log("\n[TEST 5] Verify Direct ID Access Protection (IDOR Prevention)...");
  if (org1Clients.data.length > 0) {
    const org1ClientId = org1Clients.data[0].id;
    const directClientRes = await request(`/clients/${org1ClientId}`, { headers: { Authorization: `Bearer ${org2Token}` } });
    assert(directClientRes.status === 403, `Org 2 blocked with HTTP 403 when requesting Org 1 client ID ${org1ClientId}`);
  }

  // 6. Verify Services Isolation
  console.log("\n[TEST 6] Verify Services Master Isolation...");
  const org1Services = (await request("/services", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Services = (await request("/services", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Services.data.length} service(s). Org 2 sees ${org2Services.data.length} service(s).`);
  const hasLeakedService = org2Services.data.some(s => s.organization_id === 1);
  assert(!hasLeakedService, "Org 2 CANNOT see any services belonging to Org 1");

  // 7. Verify Billing / Invoices Isolation
  console.log("\n[TEST 7] Verify Billing & Invoices Isolation...");
  const org1Invoices = (await request("/billing/invoices", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Invoices = (await request("/billing/invoices", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Invoices.data.length} invoice(s). Org 2 sees ${org2Invoices.data.length} invoice(s).`);
  assert(org1Invoices.data.length > 0, "Org 1 has invoices");
  assert(org2Invoices.data.length === 0, "Org 2 has 0 invoices from Org 1");

  // Attempt to access Org 1's invoice #1 directly from Org 2
  const directInvRes = await request("/billing/invoices/1", { headers: { Authorization: `Bearer ${org2Token}` } });
  assert(directInvRes.status === 403, "Org 2 blocked with HTTP 403 from viewing Org 1 invoice details");

  // Attempt to print Org 1's invoice #1 from Org 2
  const printInvRes = await fetch(`${API}/billing/invoices/1/print`, { headers: { Authorization: `Bearer ${org2Token}` } });
  assert(printInvRes.status === 403, "Org 2 blocked with HTTP 403 from printing Org 1 invoice");

  // 8. Verify Employee Master Isolation
  console.log("\n[TEST 8] Verify Employee Master Isolation...");
  const org1Employees = (await request("/employees", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Employees = (await request("/employees", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Employees.data.length} employee(s). Org 2 sees ${org2Employees.data.length} employee(s).`);
  const hasLeakedEmployee = org2Employees.data.some(e => e.organization_id === 1);
  assert(!hasLeakedEmployee, "Org 2 CANNOT see employees of Org 1");

  // 9. Verify Asset Master Isolation
  console.log("\n[TEST 9] Verify Asset Management Isolation...");
  const org1Assets = (await request("/assets", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Assets = (await request("/assets", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Assets.data.length} asset(s). Org 2 sees ${org2Assets.data.length} asset(s).`);
  const hasLeakedAsset = org2Assets.data.some(a => a.organization_id === 1);
  assert(!hasLeakedAsset, "Org 2 CANNOT see assets of Org 1");

  // 10. Verify Appointments Isolation
  console.log("\n[TEST 10] Verify Appointments Isolation...");
  const org1Appts = (await request("/appointments", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  const org2Appts = (await request("/appointments", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 sees ${org1Appts.data.length} appointment(s). Org 2 sees ${org2Appts.data.length} appointment(s).`);
  const hasLeakedAppt = org2Appts.data.some(a => a.organization_id === 1);
  assert(!hasLeakedAppt, "Org 2 CANNOT see appointments of Org 1");

  // 11. Verify Financial Overview & Expenses Isolation
  console.log("\n[TEST 11] Verify Financial Overview Isolation...");
  const org1BillingLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "billing@wellness.com", password: "password123" }
  });
  const org1Finance = (await request("/finance/overview", { headers: { Authorization: `Bearer ${org1BillingLogin.data.data.token}` } })).data;
  const org2Finance = (await request("/finance/overview", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  console.log(`  Org 1 total revenue: ₹${org1Finance.data?.summary?.totalRevenue}, Org 2 total revenue: ₹${org2Finance.data?.summary?.totalRevenue}`);
  assert(org2Finance.data?.summary?.totalRevenue === 0, "Org 2 has 0 revenue leaked from Org 1");

  // 12. Create a new Client in Org 2 and Verify Bidirectional Isolation
  console.log("\n[TEST 12] Create new client in Org 2 & verify bidirectional isolation...");
  const newClientPhone = "99" + Math.floor(10000000 + Math.random() * 90000000);
  const createdClient = await request("/clients", {
    method: "POST",
    headers: { Authorization: `Bearer ${org2Token}` },
    body: {
      firstName: "Aarav",
      lastName: "Goan",
      mobile: newClientPhone,
      email: `aarav_${Date.now()}@prana.com`,
      gender: "MALE",
      city: "Candolim",
      branchId: 3
    }
  });
  assert(createdClient.status === 201, "Successfully created client in Org 2");
  assert(createdClient.data.data.organization_id === 2, "Created client automatically assigned organization_id = 2");
  assert(createdClient.data.data.branch_id === 3, "Created client assigned branch_id = 3");

  // Org 2 should now see this new client
  const updatedOrg2Clients = (await request("/clients", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  assert(updatedOrg2Clients.data.some(c => c.mobile === newClientPhone), "Org 2 CAN see its newly created client");

  // Org 1 must NOT see this new client!
  const updatedOrg1Clients = (await request("/clients", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  assert(!updatedOrg1Clients.data.some(c => c.mobile === newClientPhone), "Org 1 CANNOT see Org 2's new client");

  // 13. Create a new Invoice in Org 2
  console.log("\n[TEST 13] Create Invoice in Org 2 & verify isolation...");
  const org2ClientId = createdClient.data.data.id;
  const newInvoice = await request("/billing/invoices", {
    method: "POST",
    headers: { Authorization: `Bearer ${org2Token}` },
    body: {
      clientId: org2ClientId,
      branchId: 3,
      items: [
        {
          itemType: "SERVICE",
          description: "Beachside Sunset Meditation & Abhyanga",
          quantity: 1,
          unitPrice: 3500,
          taxRate: 18
        }
      ],
      discount: 200,
      notes: "SaaS Tenant Isolation Verification Invoice"
    }
  });
  assert(newInvoice.status === 201, "Created invoice in Org 2");
  assert(newInvoice.data.data.organization_id === 2, "Invoice automatically stamped with organization_id = 2");
  assert(newInvoice.data.data.branch_id === 3, "Invoice stamped with branch_id = 3");

  // Check Org 2 sees this invoice
  const refreshedOrg2Invoices = (await request("/billing/invoices", { headers: { Authorization: `Bearer ${org2Token}` } })).data;
  assert(refreshedOrg2Invoices.data.length === 1, "Org 2 sees exactly 1 invoice");

  // Check Org 1 does NOT see Org 2's invoice
  const refreshedOrg1Invoices = (await request("/billing/invoices", { headers: { Authorization: `Bearer ${org1Token}` } })).data;
  assert(!refreshedOrg1Invoices.data.some(inv => inv.id === newInvoice.data.data.id), "Org 1 CANNOT see Org 2's new invoice");

  // 14. Super Admin check
  console.log("\n[TEST 14] Super Admin Visibility Check...");
  const superInvoicesAll = (await request("/billing/invoices", { headers: { Authorization: `Bearer ${superToken}` } })).data;
  assert(superInvoicesAll.data.some(inv => inv.id === newInvoice.data.data.id), "Super Admin can see Org 2's invoice in global view");

  const superInvoicesOrg2Only = (await request("/billing/invoices?organizationId=2", { headers: { Authorization: `Bearer ${superToken}` } })).data;
  assert(superInvoicesOrg2Only.data.every(inv => inv.organization_id === 2), "Super Admin can filter invoices specifically for Org 2");

  console.log("\n===============================================================================");
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED.`);
  console.log("===============================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTenantIsolationTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
