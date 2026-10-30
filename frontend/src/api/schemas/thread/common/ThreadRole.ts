import z from "zod";

export const ThreadRoleSchema = z.string().regex(/^THR_[A-Z_]+$/);
export type ThreadRole = z.infer<typeof ThreadRoleSchema>;
