import type z from "zod";
import { DeadlineAttachmentMetadataSchema } from "../common/DeadlineAttachmentMetadata";

export const PatchDeadlineAttachmentMetadataRequestSchema = DeadlineAttachmentMetadataSchema.partial();

export type PatchDeadlineAttachmentMetadataRequest = z.infer<typeof PatchDeadlineAttachmentMetadataRequestSchema>;
