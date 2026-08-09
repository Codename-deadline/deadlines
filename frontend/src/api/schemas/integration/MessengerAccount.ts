import z from "zod";

export const MessengerSchema = z.enum(["TELEGRAM"]);
export type Messenger = z.infer<typeof MessengerSchema>;

export const MessengerAccountSchema = z.object({
  accountId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  messenger: MessengerSchema,
});
export type MessengerAccount = z.infer<typeof MessengerAccountSchema>;

export const MessengerAccountsSchema = z.array(MessengerAccountSchema);

export const UnlinkedAccountCountSchema = z.number().int().nonnegative();
