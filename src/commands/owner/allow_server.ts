import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "allow_server",
  description: "Adds a server to the allowlist.",
  usage: "!allow_server <guild_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    if (!guildId) return message.reply(`Usage: ${command.usage}`);

    await client.db.allowedGuild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });

    await client.db.guild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId, config: "" },
    });

    message.reply(`Server \`${guildId}\` has been allowed and registered.`);
  },
};

export default command;
