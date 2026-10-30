// TODO: Replace Record<string, boolean> with a proper union type
export const hasAnyEditPermission = (permissions: Record<string, boolean>): boolean =>
  Object.values(permissions).some(Boolean);
