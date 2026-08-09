import z from "zod";

export const ThreadRoleSchema = z.string().regex(/^THR_[A-Z_]+$/);
export type ThreadRole = z.infer<typeof ThreadRoleSchema>;

export const ThreadOrOrganizationRoleSchema = z.string().regex(/^(THR|ORG)_[A-Z_]+$/);
export type ThreadOrOrganizationRole = z.infer<typeof ThreadOrOrganizationRoleSchema>;
