import { Message, Guild } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "servers",
  description: "Lists all servers the bot is currently in.",
  usage: "!servers",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildCount = client.guilds.cache.size;
    const guilds = client.guilds.cache
      .map((g: Guild) => `${g.name} (${g.id})`)
      .join("\n");

    message.reply(
      `Current Servers (${guildCount}):\n\`\`\`\n${guilds.substring(0, 1900)}\n\`\`\``,
    );
  },
};

export default command;
