import z from "zod";

export const IsoUtcDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, "Invalid ISO UTC date");

export type IsoUtcDateString = z.infer<typeof IsoUtcDateSchema>;

export const IsoAsMsSchema = z
  .union([z.number(), IsoUtcDateSchema])
  .transform((val) => (typeof val === "number" ? val : new Date(val).getTime()));
