import z from "zod";
import { MessengerSchema } from "../integration/MessengerAccount";

export const BotSchema = z.strictObject({
  botId: z.number(),
  username: z.string().nonempty(),
  messenger: MessengerSchema,
});
export type Bot = z.infer<typeof BotSchema>;

export const BotsMetadataSchema = z.array(BotSchema);
export type BotsMetadata = z.infer<typeof BotsMetadataSchema>;
