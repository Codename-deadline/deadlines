import z from "zod";

export const CreateDeadlineAttachmentResponseSchema = z.object({
  attachmentId: z.number().nonnegative(),
});

export type CreateDeadlineAttachmentResponse = z.infer<typeof CreateDeadlineAttachmentResponseSchema>;
