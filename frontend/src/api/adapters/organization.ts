import type { OrganizationDTO, OrganizationResponse } from "../generated/models";
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
