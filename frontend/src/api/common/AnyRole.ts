import z from "zod";

export const AnyRoleSchema = z.string().regex(/^(THR|ORG|DDL)_[A-Z_]+$/);
export type AnyRole = z.infer<typeof AnyRoleSchema>;
