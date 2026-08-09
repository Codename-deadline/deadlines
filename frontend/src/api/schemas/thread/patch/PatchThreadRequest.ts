import z from "zod";

export const PatchThreadRequestSchema = z
  .strictObject({
    title: z.string(),
    description: z.string(),
  })
  .partial();

export type PatchThreadRequest = z.infer<typeof PatchThreadRequestSchema>;
