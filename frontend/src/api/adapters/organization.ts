import type {
  CreateOrganizationRequest,
  OrganizationDTO,
  OrganizationResponse,
  OrganizationResponseWithRole,
} from "../generated/models";
import { normalizeInvitations, toTimestamp } from "./common";

export type OrganizationModel<T extends OrganizationDTO = OrganizationResponse> = Omit<
  T,
  "createdAt" | "description"
> & {
  createdAt: number;
  description: string | null;
};

/** Also maps basic organizations nested inside invitation responses. */
export function toOrganization<T extends OrganizationDTO>(dto: T): OrganizationModel<T> {
  const { createdAt, description, ...rest } = dto;
  return { ...rest, createdAt: toTimestamp(createdAt), description: description ?? null };
}

export type OrganizationListModel = OrganizationModel<OrganizationResponseWithRole>;

export function toOrganizationRole(role: string) {
  if (role === "ORG_MEMBER" || role === "ORG_ADMIN" || role === "ORG_OWNER") return role;
  throw new TypeError("Invalid organization role");
}

export function toCreateOrganizationRequest(
  request: Omit<CreateOrganizationRequest, "invitations"> & {
    invitations: { username: string; role: string }[];
  },
): CreateOrganizationRequest {
  return { ...request, invitations: normalizeInvitations(request.invitations, toOrganizationRole) };
}
