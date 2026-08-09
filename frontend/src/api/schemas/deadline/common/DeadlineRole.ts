import z from "zod";

export const DeadlineRoleSchema = z.string().regex(/^DDL_[A-Z_]+$/);

export type DeadlineRole = z.infer<typeof DeadlineRoleSchema>;
