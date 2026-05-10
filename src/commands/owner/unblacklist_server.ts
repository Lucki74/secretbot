import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "unblacklist_server",
  description: "Removes a server from the blacklist.",
  usage: "!unblacklist_server <guild_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    if (!guildId) return message.reply(`Usage: ${command.usage}`);

    const result = await client.db.blacklistedGuild.deleteMany({
      where: { id: guildId },
    });

    if (result.count > 0) {
      message.reply(
        `Server \`${guildId}\` has been removed from the blacklist.`,
      );
    } else {
      message.reply(`Server \`${guildId}\` was not blacklisted.`);
    }
  },
};

export default command;
