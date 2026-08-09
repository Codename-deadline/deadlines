import z from "zod";

const HASH_ALGORITHM = "sha256";

export const GlobalMetadataSchema = z.object({
  rolesMetadataVersion: z.hash(HASH_ALGORITHM),
  botsMetadataVersion: z.hash(HASH_ALGORITHM),
});

export type GlobalMetadata = z.infer<typeof GlobalMetadataSchema>;
