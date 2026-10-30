import type { CreateAttachmentBody } from "../generated/models";

/** Spring's @RequestPart FileMetadata requires a JSON part, not a text field. */
export function createAttachmentFormData(body: CreateAttachmentBody): FormData {
  const formData = new FormData();
  formData.append("meta", new Blob([JSON.stringify(body.meta)], { type: "application/json" }));
  formData.append("file", body.file);
  return formData;
}
