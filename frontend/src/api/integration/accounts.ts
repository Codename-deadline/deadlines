import { client } from "@/api/client";
import { getEndpoint } from "@/api/endpoints";
import {
  type MessengerAccount,
  MessengerAccountSchema,
  UnlinkedAccountCountSchema,
} from "@/api/schemas/integration/MessengerAccount";
import { validateAndRequest, validateWith } from "@/api/utils";

export const linkMessengerAccount = async (request: MessengerAccount) =>
  validateAndRequest(MessengerAccountSchema, request, (validated) =>
    client.post<undefined>(getEndpoint("INTEGRATION_ACCOUNT_LINK"), validated),
  );

export const unlinkMessengerAccount = async (request: MessengerAccount) =>
  validateAndRequest(MessengerAccountSchema, request, (validated) =>
    client.delete<number>(getEndpoint("INTEGRATION_ACCOUNT_UNLINK"), {
      body: validated,
      validate: validateWith(UnlinkedAccountCountSchema),
    }),
  );
