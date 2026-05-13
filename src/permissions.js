import { ROLE_IDS } from './constants/roles';

export function canCreateProject(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

export function canDeleteProject(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

/** Add new inventory lines. */
export function canAddInventoryItem(roleId) {
  return roleId === ROLE_IDS.WAREHOUSE_STAFF;
}

/** Change quantity on existing lines (+/−). PM excluded per stakeholder. */
export function canAdjustInventoryQuantity(roleId) {
  return (
    roleId === ROLE_IDS.WAREHOUSE_STAFF ||
    roleId === ROLE_IDS.FOREMAN
  );
}

export function canUploadPackingSlip(roleId) {
  return (
    roleId === ROLE_IDS.WAREHOUSE_STAFF ||
    roleId === ROLE_IDS.FOREMAN
  );
}

/** Create and manage purchase orders (PM only). */
export function canCreatePO(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

/** View PO tab — PM only. */
export function canViewPO(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

/** Add delivery line items after scanning a packing slip. */
export function canAddDeliveryItems(roleId) {
  return (
    roleId === ROLE_IDS.WAREHOUSE_STAFF ||
    roleId === ROLE_IDS.FOREMAN
  );
}

/** Create a warehouse-to-jobsite transfer. */
export function canCreateTransfer(roleId) {
  return (
    roleId === ROLE_IDS.WAREHOUSE_STAFF ||
    roleId === ROLE_IDS.FOREMAN
  );
}

/** Advance transfer status (manifested, in_transit, delivered). */
export function canAdvanceTransfer(roleId) {
  return (
    roleId === ROLE_IDS.PROJECT_MANAGER ||
    roleId === ROLE_IDS.WAREHOUSE_STAFF ||
    roleId === ROLE_IDS.FOREMAN
  );
}

export function canApproveRequests(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

export function canSubmitPoChangeRequest(roleId) {
  return roleId === ROLE_IDS.WAREHOUSE_STAFF;
}

export function canApprovePoChanges(roleId) {
  return roleId === ROLE_IDS.PROJECT_MANAGER;
}

export function canRejectDelivery(roleId) {
  return roleId === ROLE_IDS.WAREHOUSE_STAFF;
}
