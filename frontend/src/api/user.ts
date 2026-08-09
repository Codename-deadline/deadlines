import z from "zod";
import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import { type MessengerAccount, MessengerAccountsSchema } from "./schemas/integration/MessengerAccount";
import {
  type PagedOrganizationWithStatsAndRole,
  PagedOrganizationWithStatsAndRoleSchema,
} from "./schemas/organization/common/Organization";
import { type User, UserSchema } from "./schemas/user/common/User";
import { type PatchUserRequest, PatchUserRequestSchema } from "./schemas/user/patch/PatchUserRequest";
import { validateAndRequest, validateWith } from "./utils";

export const getMe = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<User>(getEndpoint("USER_ME"), {
      validate: validateWith(UserSchema),
    }),
  );

export const patchUser = async (request: PatchUserRequest) =>
  validateAndRequest(PatchUserRequestSchema, request, (validated) =>
    client.patch<undefined>(getEndpoint("USER_PATCH"), validated),
  );

export const getLinkedMessengerAccounts = async () =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<MessengerAccount[]>(getEndpoint("USER_LINKED_ACCOUNTS"), {
      validate: validateWith(MessengerAccountsSchema),
    }),
  );

export const getOrganizations = async (page: number) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<PagedOrganizationWithStatsAndRole>(
      getEndpoint("USER_MY_ORGANIZATIONS", {
        queryParams: { page },
      }),
      {
        validate: validateWith(PagedOrganizationWithStatsAndRoleSchema),
      },
    ),
  );

export const getUsersWithUsernameStartingWith = async (startsWith: string) =>
  validateAndRequest(EmptySchema, {}, () =>
    client.get<string[]>(
      getEndpoint("USER_USERNAME_HINTS", {
        queryParams: { startsWith },
      }),
      {
        validate: validateWith(z.array(z.string())),
      },
    ),
  );

export const signOut = async () =>
  validateAndRequest(EmptySchema, {}, () => client.get<undefined>(getEndpoint("USER_SIGN_OUT")));

export const deleteUser = async () =>
  validateAndRequest(EmptySchema, {}, () => client.delete(getEndpoint("USER_DELETE")));
