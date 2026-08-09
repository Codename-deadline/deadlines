import z from "zod";

export const OrganizationRoleSchema = z.string().regex(/^ORG_[A-Z]+$/);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
