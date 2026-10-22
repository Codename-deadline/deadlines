import type { AttachmentResponse } from "../generated/models";
import { toTimestamp } from "./common";

export function toAttachment(dto: AttachmentResponse) {
  return { ...dto, uploadedAt: toTimestamp(dto.uploadedAt), uploadedBy: dto.uploadedBy ?? null };
}

export type AttachmentModel = ReturnType<typeof toAttachment>;
