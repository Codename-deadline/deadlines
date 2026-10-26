import z from "zod";
import { client } from "./client";
import { getEndpoint } from "./endpoints";
import { EmptySchema } from "./schemas/common/Empty";
import {
  type PagedOrganizationWithStatsAndRole,
  PagedOrganizationWithStatsAndRoleSchema,
} from "./schemas/organization/common/Organization";
import { validateAndRequest, validateWith } from "./utils";

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
