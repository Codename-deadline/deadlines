import z from "zod";

export const createRoleChangeRequest = <T extends z.ZodString>(newRole: T) =>
  z.strictObject({
    subjectUsername: z.string(),
    newRole: newRole,
  });
