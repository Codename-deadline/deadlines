import z from "zod";

export const PutDeadlineAttachmentRequestSchema = z.file();

export type PutDeadlineAttachmentRequest = z.infer<typeof PutDeadlineAttachmentRequestSchema>;
