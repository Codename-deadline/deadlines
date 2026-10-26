import z from "zod";
import { IsoAsMsSchema } from "@/api/schemas/common/IsoUtcDate";
import { OrganizationTypeSchema } from "@/api/schemas/organization/common/OrganizationType";

export const OrganizationSchema = z.compile(
  z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    type: OrganizationTypeSchema,
    createdAt: IsoAsMsSchema,
  }),
);
