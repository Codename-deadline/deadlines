import type { OrganizationInvitationResponse } from "../generated/models";
import { toTimestamp } from "./common";
import { toOrganization } from "./organization";

export function toInvitation(dto: OrganizationInvitationResponse) {
  return {
    ...dto,
    createdAt: toTimestamp(dto.createdAt),
    answeredAt: dto.answeredAt == null ? null : toTimestamp(dto.answeredAt),
    organization: toOrganization(dto.organization),
  };
}

export type InvitationModel = ReturnType<typeof toInvitation>;
