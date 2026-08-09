import z from "zod";

export const OrganizationTypeSchema = z.enum(["PUBLIC", "PRIVATE", "PERSONAL"]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
