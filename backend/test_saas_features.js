const API_BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runSaaSTests() {
  console.log('========================================================================');
  console.log(' 🌐 SAAS MULTI-TENANT, EMPLOYEES, ASSETS, FINANCE & INVOICE PRINT TEST');
  console.log('========================================================================\n');
  const results = [];

  const record = (name, passed, detail = '') => {
    results.push({ name, passed, detail });
    console.log(`${passed ? '✅ [PASS]' : '❌ [FAIL]'} ${name.padEnd(46)} | ${detail}`);
  };

  try {
    // 1. Super Admin Authentication
    const adminLoginRes = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@wellness.com', password: 'admin123' }
    });
    const adminToken = adminLoginRes.data?.data?.token;
    record('1. Super Admin Authentication & Token', !!adminToken, `User: ${adminLoginRes.data?.data?.user?.firstName} (${adminLoginRes.data?.data?.user?.role})`);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Global SaaS Metrics
    const metricsRes = await req('/saas/metrics', { headers: adminHeaders });
    const metrics = metricsRes.data?.data;
    record('2. SaaS Platform Metrics', !!metrics, `Centres: ${metrics?.totalCentres}, Branches: ${metrics?.totalBranches}, Revenue: ₹${metrics?.totalPlatformRevenue}`);

    // 3. Provision New Wellness Centre Tenant (Multi-Tenant Atomic Flow)
    const newCentreCode = `VEDA-${Date.now().toString().slice(-4)}`;
    const createCentreRes = await req('/saas/centres', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Veda Ayurvedic & Integrative Sanctuary',
        code: newCentreCode,
        slug: `veda-sanctuary-${Date.now().toString().slice(-4)}`,
        email: `contact@${newCentreCode.toLowerCase()}.com`,
        phone: '+91 80 4455 6677',
        address: '77 Heritage Boulevard, Indiranagar, Bengaluru',
        planType: 'PRO',
        maxBranches: 5,
        taxNumber: 'GSTIN-29AAACV1234D1ZP',
        adminFirstName: 'Dr. Siddharth',
        adminLastName: 'Varma',
        adminEmail: `admin@${newCentreCode.toLowerCase()}.com`,
        adminPassword: 'admin123',
        adminPhone: '+91 99887 76655'
      }
    });
    const createdCentre = createCentreRes.data?.data?.centre;
    const createdBranch = createCentreRes.data?.data?.branch;
    const createdAdmin = createCentreRes.data?.data?.adminUser;
    record('3. Provision Wellness Centre & Tenant Admin', createCentreRes.data?.success, `Centre ID: ${createdCentre?.id}, Code: ${createdCentre?.code}, Admin: ${createdAdmin?.email}`);

    // 4. Create Secondary Branch for the new Centre
    const createBranchRes = await req(`/saas/centres/${createdCentre.id}/branches`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Veda Whitefield Wellness Centre',
        code: `${newCentreCode}-WHT-02`,
        email: `whitefield@${newCentreCode.toLowerCase()}.com`,
        phone: '+91 80 4455 6699',
        address: 'ITPL Main Road, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066'
      }
    });
    record('4. Multi-Branch Allocation per Tenant', createBranchRes.data?.success, `Branch: ${createBranchRes.data?.data?.name} (${createBranchRes.data?.data?.code})`);

    // 5. Employees Master Directory
    const empListRes = await req('/employees', { headers: adminHeaders });
    record('5. Employees Master Directory Retrieval', Array.isArray(empListRes.data?.data) && empListRes.data?.data?.length > 0, `Total Staff: ${empListRes.data?.data?.length}`);

    // 6. Register New Employee
    const createEmpRes = await req('/employees', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        firstName: 'Divya',
        lastName: 'Menon',
        email: `divya.${Date.now()}@wellness.com`,
        phone: '+91 98455 12345',
        department: 'THERAPY',
        designation: 'Senior Hydrotherapy Specialist',
        salary: 62000,
        joiningDate: '2026-10-01',
        emergencyContact: 'Rajan Menon - +91 98455 54321'
      }
    });
    record('6. Employee Registration & Master Record', createEmpRes.data?.success, `Emp: ${createEmpRes.data?.data?.first_name} ${createEmpRes.data?.data?.last_name} (${createEmpRes.data?.data?.employee_code})`);

    // 7. Assets Management Directory
    const assetsRes = await req('/assets', { headers: adminHeaders });
    record('7. Physical Assets Register Retrieval', Array.isArray(assetsRes.data?.data) && assetsRes.data?.data?.length > 0, `Total Assets: ${assetsRes.data?.data?.length}`);

    // 8. Register New Physical Equipment Asset
    const createAssetRes = await req('/assets', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Cryotherapy Whole Body Cold Chamber',
        category: 'WELLNESS_MACHINE',
        serialNumber: `CRYO-PRO-${Date.now().toString().slice(-4)}`,
        purchaseCost: 650000,
        currentValue: 620000,
        locationRoom: 'Cold Therapy Chamber 1',
        vendorName: 'CryoTech International',
        warrantyExpiry: '2029-12-31',
        nextServiceDate: '2027-04-15'
      }
    });
    const newAsset = createAssetRes.data?.data;
    record('8. Asset Capitalization & Tagging', createAssetRes.data?.success, `Asset: ${newAsset?.name} (${newAsset?.asset_code}, ₹${newAsset?.purchase_cost})`);

    // 9. Record Asset Maintenance Log
    const maintRes = await req(`/assets/${newAsset.id}/maintenance`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        serviceDate: '2026-10-07',
        maintenanceType: 'PREVENTIVE',
        cost: 6500,
        performedBy: 'Lead Cryo Systems Engineer',
        notes: 'Initial pressure inspection and nitrogen valve test passed.',
        nextDueDate: '2027-04-15'
      }
    });
    record('9. Equipment Maintenance Log & Audit', maintRes.data?.success, `Service: ${maintRes.data?.data?.maintenance_type} by ${maintRes.data?.data?.performed_by}`);

    // 10. Accounts & Financial Overview (P&L)
    const finOverviewRes = await req('/finance/overview', { headers: adminHeaders });
    const fin = finOverviewRes.data?.data;
    record('10. Financial P&L Statement & Margin', !!fin?.summary, `Revenue: ₹${fin?.summary?.totalRevenue}, Expenses: ₹${fin?.summary?.totalExpenses}, Net Profit: ₹${fin?.summary?.netProfit}`);

    // 11. Record Operational Expense
    const expenseRes = await req('/finance/expenses', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: 'Organic Herbal Steam Infusion Oils',
        categoryId: 3, // Clinical supplies
        amount: 14200,
        taxAmount: 2556,
        paymentDate: '2026-10-07',
        paymentMethod: 'UPI',
        vendorPayee: 'Kerala Forest Herbals Co.',
        referenceNumber: 'UPI-4409921827',
        notes: 'Monthly Eucalyptus and Camphor steam essences'
      }
    });
    record('11. Operational Expense Ledger Entry', expenseRes.data?.success, `Expense: ${expenseRes.data?.data?.expense_code} (₹${expenseRes.data?.data?.amount})`);

    // 12. Printable Tax Invoice Verification
    const invoiceListRes = await req('/billing/invoices', { headers: adminHeaders });
    const invoiceId = invoiceListRes.data?.data?.[0]?.id || 1;

    const printRes = await fetch(`${API_BASE}/billing/invoices/${invoiceId}/print`, { headers: adminHeaders });
    const printHtml = await printRes.text();
    const hasTaxHeader = printHtml.includes('TAX INVOICE') && printHtml.includes('AURA LIFE WELLNESS');
    const hasPrintScript = printHtml.includes('window.print()') || printHtml.includes('@media print');
    record('12. Printable A4 Tax Invoice Document Engine', hasTaxHeader && hasPrintScript, `Invoice ID ${invoiceId} printable HTML verified (${printHtml.length} bytes)`);

    console.log('\n========================================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(` 🏆 SAAS EXPANSION RESULT: ${passedCount} OF ${results.length} VALIDATIONS PASSED!`);
    console.log('========================================================================\n');

  } catch (error) {
    console.error('\n❌ SaaS E2E Validation Failed:', error);
    process.exit(1);
  }
}

runSaaSTests();
