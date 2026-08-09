import z from "zod";
import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import {
  type DeadlineAttachment,
  DeadlineAttachmentSchema,
} from "./schemas/deadline-attachment/common/DeadlineAttachment";
import {
  type CreateDeadlineAttachmentRequest,
  CreateDeadlineAttachmentRequestSchema,
} from "./schemas/deadline-attachment/create/CreateDeadlineAttachmentRequest";
import { CreateDeadlineAttachmentResponseSchema } from "./schemas/deadline-attachment/create/CreateDeadlineAttachmentResponse";
import {
  type PatchDeadlineAttachmentMetadataRequest,
  PatchDeadlineAttachmentMetadataRequestSchema,
} from "./schemas/deadline-attachment/patch/PatchDeadlineAttachmentMetadataRequest";
import {
  type PutDeadlineAttachmentRequest,
  PutDeadlineAttachmentRequestSchema,
} from "./schemas/deadline-attachment/put/PutDeadlineAttachmentRequest";
import { validateAndRequest, validateWith } from "./utils";

const createAttachmentFormData = (request: { meta?: { filename: string }; file: File }) => {
  const formData = new FormData();
  if (request.meta) {
    formData.append("meta", new Blob([JSON.stringify(request.meta)], { type: "application/json" }));
  }
  formData.append("file", request.file);
  return formData;
};

export const createDeadlineAttachment = async (ddlId: number, request: CreateDeadlineAttachmentRequest) =>
  validateAndRequest(CreateDeadlineAttachmentRequestSchema, request, (validated) =>
    client.post(
      getEndpoint("DEADLINE_ATTACHMENT_POST", {
        pathParams: { ddlId },
      }),
      createAttachmentFormData(validated),
      {
        validate: validateWith(CreateDeadlineAttachmentResponseSchema),
      },
    ),
  );

export const getAllDeadlineAttachments = async (ddlId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<DeadlineAttachment[]>(
      getEndpoint("DEADLINE_ATTACHMENTS_METADATA_GET", {
        pathParams: { ddlId },
      }),
      {
        validate: validateWith(z.array(DeadlineAttachmentSchema)),
      },
    ),
  );

export const patchDeadlineAttachmentMetadata = async (
  attachmentId: number,
  request: PatchDeadlineAttachmentMetadataRequest,
) =>
  validateAndRequest(PatchDeadlineAttachmentMetadataRequestSchema, request, (validated) =>
    client.patch(
      getEndpoint("DEADLINE_ATTACHMENT_METADATA_PATCH", {
        pathParams: { attachmentId },
      }),
      validated,
    ),
  );

export const putDeadlineAttachment = async (attachmentId: number, request: PutDeadlineAttachmentRequest) =>
  validateAndRequest(PutDeadlineAttachmentRequestSchema, request, (validated) =>
    client.put(
      getEndpoint("DEADLINE_ATTACHMENT_PUT", {
        pathParams: { attachmentId },
      }),
      createAttachmentFormData({ file: validated }),
    ),
  );

export const deleteDeadlineAttachment = async (attachmentId: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.delete(
      getEndpoint("DEADLINE_ATTACHMENT_DELETE", {
        pathParams: { attachmentId },
      }),
    ),
  );

export const getDeadlineAttachment = async (attachmentId: number, disposition: "attachment" | "inline") =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<Blob>(
      getEndpoint("DEADLINE_ATTACHMENT_GET", {
        pathParams: { attachmentId },
        queryParams: { disposition },
      }),
      { parseAs: "blob" },
    ),
  );
