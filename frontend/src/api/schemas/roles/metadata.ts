import z from "zod";

export const RolesMetadataSchema = z.object({
  roles: z.array(z.string().regex(/^(ORG|THR|DDL)_[A-Z_]+/)),
  matrix: z.array(z.array(z.boolean())),
});

export type RolesMetadata = z.infer<typeof RolesMetadataSchema>;
