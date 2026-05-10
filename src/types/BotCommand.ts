import { Message } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export interface BotCommand {
  name: string;
  description?: string;
  category?: string;
  usage?: string;
  requiredLevel?: number;
  aliases?: string[];
  cooldown?: number; 
  execute: (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => Promise<any>;
}
