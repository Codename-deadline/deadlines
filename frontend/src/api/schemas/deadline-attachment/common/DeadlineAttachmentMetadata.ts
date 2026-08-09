import z from "zod";

export const DeadlineAttachmentMetadataSchema = z.object({
  filename: z.string().nonempty(),
});
export type DeadlineAttachmentMetadata = z.infer<typeof DeadlineAttachmentMetadataSchema>;
