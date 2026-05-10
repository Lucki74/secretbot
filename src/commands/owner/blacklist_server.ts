import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "blacklist_server",
  description: "Blacklists a server and makes the bot leave it.",
  usage: "!blacklist_server <guild_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    if (!guildId) return message.reply(`Usage: ${command.usage}`);

    await client.db.blacklistedGuild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      await guild.leave();
      message.reply(
        `Server \`${guildId}\` has been blacklisted and the bot has left.`,
      );
    } else {
      message.reply(`Server \`${guildId}\` has been blacklisted.`);
    }
  },
};

export default command;
