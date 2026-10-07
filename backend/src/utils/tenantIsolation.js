/**
 * Tenant Isolation Utility
 * Enforces strict multi-tenancy scoping based on authenticated user credentials.
 */
export function getTenantScope(req) {
  const isSuper = req.user?.role === "SUPER_ADMIN";
  const isCentreAdmin = req.user?.role === "CENTRE_ADMIN" || req.user?.role === "ADMIN";

  // Organization scoping:
  // Super Admin can view all or optionally filter by query.
  // Centre Admin and Branch Admin/Staff are strictly locked to their user.organizationId.
  const organizationId = isSuper
    ? (req.query?.organizationId ? parseInt(req.query.organizationId) : null)
    : (req.user?.organizationId || null);

  // Branch scoping:
  // Super Admin & Centre Admin can view all branches in the org or filter by query branchId.
  // Branch Admin & Staff are locked to their assigned branchId.
  let branchId = null;
  if (isSuper || isCentreAdmin) {
    branchId = req.query?.branchId ? parseInt(req.query.branchId) : null;
  } else {
    branchId = req.user?.branchId || (req.query?.branchId ? parseInt(req.query.branchId) : null);
  }

  return {
    organizationId,
    branchId,
    isSuper,
    isCentreAdmin
  };
}
