import { client } from "@/api/client";
import { getEndpoint } from "@/api/endpoints";
import { EmptySchema } from "@/api/schemas/common/Empty";
import { type GlobalMetadata, GlobalMetadataSchema } from "@/api/schemas/metadata/global";
import { type BotsMetadata, BotsMetadataSchema } from "./schemas/metadata/BotsMetadata";
import { validateAndRequest, validateWith } from "./utils";

export const getApplicationMetadataVersions = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<GlobalMetadata>(getEndpoint("METADATA_GET"), {
      validate: validateWith(GlobalMetadataSchema),
    }),
  );

export const getBotsMetadata = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<BotsMetadata>(getEndpoint("METADATA_BOTS_GET"), {
      validate: validateWith(BotsMetadataSchema),
    }),
  );
