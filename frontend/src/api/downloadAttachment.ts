import { getGetAttachmentUrl } from "./generated/endpoints/attachments/attachments";
import { request } from "./transport";

/** The API redirects to storage; the final body is binary, not the API's JSON response. */
export async function downloadAttachment(
  attachmentId: number,
  disposition: "attachment" | "inline" = "attachment",
  options: RequestInit = {},
): Promise<Blob> {
  const { data } = await request<Blob>(
    getGetAttachmentUrl(attachmentId, { disposition }),
    { ...options, method: "GET", redirect: "follow" },
    "blob",
  );

  return data;
}
