import z from "zod";

export const JWTSchema = z.jwt();

export type JWT = z.infer<typeof JWTSchema>;
