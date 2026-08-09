import z from "zod";

export const EmptySchema = z.object({}).strict();

export type Empty = z.infer<typeof EmptySchema>;
