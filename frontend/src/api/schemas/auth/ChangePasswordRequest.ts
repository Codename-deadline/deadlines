import z from "zod";

export const ChangePasswordRequestSchema = z.strictObject({
  oldPassword: z.string().nullable(),
  newPassword: z.string().nonempty(),
});

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
