import z from "zod";
import { IsoAsMsSchema } from "../../common/IsoUtcDate";
import { MinimalUserSchema } from "../../user/common/User";
import { DeadlineAttachmentPermissionsSchema } from "./DeadlineAttachmentPermissions";

export const DeadlineAttachmentSchema = z.compile(
  z.object({
    id: z.number(),
    filename: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().nonnegative(),
    uploadedBy: MinimalUserSchema.nullable(),
    attachedTo: z.number(),
    uploadedAt: IsoAsMsSchema,
    permissions: DeadlineAttachmentPermissionsSchema,
  }),
);
export type DeadlineAttachment = z.infer<typeof DeadlineAttachmentSchema>;
