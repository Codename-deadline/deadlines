import { normalizeUsername } from "@/utils/validation";
import type {
  CreateOrganizationRequest,
  OrganizationDTO,
  OrganizationResponse,
  OrganizationResponseWithRole,
  UsernameRolePair,
} from "../generated/models";
import { toTimestamp } from "./common";

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
  const invitations = new Map<string, UsernameRolePair>();
  for (const invitation of request.invitations) {
    const username = normalizeUsername(invitation.username.trim());
    if (username && !invitations.has(username))
      invitations.set(username, { username, role: toOrganizationRole(invitation.role) });
  }
  return { ...request, invitations: [...invitations.values()] };
}
