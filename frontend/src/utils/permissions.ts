export const hasAnyEditPermission = (permissions: Record<string, boolean>): boolean =>
  Object.values(permissions).some(Boolean);
