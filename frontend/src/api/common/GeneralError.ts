import z from "zod";

export const GeneralErrorSchema = z.object({
  detail: z.string().readonly().optional(),
  params: z.looseObject({}).optional(),
  code: z.string(),
});

export type GeneralError = z.infer<typeof GeneralErrorSchema>;
