import z from "zod";
import { DeadlineAttachmentMetadataSchema } from "../common/DeadlineAttachmentMetadata";

export const CreateDeadlineAttachmentRequestSchema = z.object({
  meta: DeadlineAttachmentMetadataSchema,
  file: z.file(),
});

export type CreateDeadlineAttachmentRequest = z.infer<typeof CreateDeadlineAttachmentRequestSchema>;
