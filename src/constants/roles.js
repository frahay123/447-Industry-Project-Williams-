/** Role ids (must match backend JWT roleId values). */

/** Bump when tab sets or role metadata change so memoized UI (session unchanged) refreshes. */
export const ROLES_REVISION = 8;

export const ROLE_IDS = {
  WAREHOUSE_STAFF: 'warehouse_staff',
  // field_crew merged into warehouse_staff — alias kept for any cached sessions.
  FIELD_CREW: 'warehouse_staff',
  FOREMAN: 'foreman',
  PROJECT_MANAGER: 'project_manager',
  ADMINISTRATOR: 'administrator',
};

export const TAB_NAMES = {
  DASHBOARD: 'Dashboard',
  PROJECTS: 'Projects',
  POS: 'POs',
  DELIVERIES: 'Deliveries',
  INVENTORY: 'Inventory',
  TRANSFERS: 'Transfers',
  ADMIN: 'Admin',
  SETTINGS: 'Settings',
};

const TABS_PM = [
  TAB_NAMES.DASHBOARD,
  TAB_NAMES.PROJECTS,
  TAB_NAMES.POS,
  TAB_NAMES.DELIVERIES,
  TAB_NAMES.INVENTORY,
  TAB_NAMES.TRANSFERS,
];

const TABS_STANDARD = [
  TAB_NAMES.DASHBOARD,
  TAB_NAMES.PROJECTS,
  TAB_NAMES.DELIVERIES,
  TAB_NAMES.INVENTORY,
  TAB_NAMES.TRANSFERS,
];

/** Built-in administrator: Users tab and Settings. */
const TABS_USERS_ONLY = [TAB_NAMES.ADMIN, TAB_NAMES.SETTINGS];

export const FOREMAN_TYPES = [
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'sheet_metal', label: 'Sheet Metal' },
  { id: 'refrigerant', label: 'Refrigerant' },
];

export const ROLES = [
  {
    id: ROLE_IDS.WAREHOUSE_STAFF,
    label: 'Warehouse / Logistics',
    tabs: TABS_STANDARD,
  },
  {
    id: ROLE_IDS.FOREMAN,
    label: 'Foreman',
    tabs: TABS_STANDARD,
  },
  {
    id: ROLE_IDS.PROJECT_MANAGER,
    label: 'Project Manager',
    tabs: TABS_PM,
  },
  {
    id: ROLE_IDS.ADMINISTRATOR,
    label: 'Administrator',
    tabs: TABS_USERS_ONLY,
  },
];

/** Roles the built-in admin can assign (PM / warehouse / logistics / foreman — not Administrator). */
export const ASSIGNABLE_ROLES = ROLES.filter(
  (r) => r.id !== ROLE_IDS.ADMINISTRATOR,
);

export function getRoleById(id) {
  if (!id) return null;
  return ROLES.find((r) => r.id === id) ?? null;
}

export function getTabsForSession(session) {
  if (!session?.roleId) return [];
  if (session.canManageUsers) return TABS_USERS_ONLY;
  return getRoleById(session.roleId)?.tabs ?? [];
}
