import z from "zod";

export const MessengerSchema = z.enum(["TELEGRAM"]);
export type Messenger = z.infer<typeof MessengerSchema>;
