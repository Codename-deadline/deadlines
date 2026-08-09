import z from "zod";

export const paginationResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    totalPages: z.number(),
  });

export type PagedResponse<T> = {
  data: T[];
  totalPages: number;
};
