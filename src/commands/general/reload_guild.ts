import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "reload_guild",
  description: "Reloads the guild configuration from the database.",
  usage: "!reload_guild",
  category: "general",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guildId) return;
    ConfigManager.invalidate(message.guildId);
    message.reply("Guild configuration reloaded successfully.");
  },
};

export default command;
