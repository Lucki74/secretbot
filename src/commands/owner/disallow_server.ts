import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "disallow_server",
  description: "Removes a server from the allowlist and leaves it.",
  usage: "!disallow_server <guild_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    if (!guildId) return message.reply(`Usage: ${command.usage}`);

    await client.db.allowedGuild.deleteMany({ where: { id: guildId } });

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      await guild.leave();
      message.reply(
        `Server \`${guildId}\` removed from allowlist and bot has left.`,
      );
    } else {
      message.reply(`Server \`${guildId}\` removed from allowlist.`);
    }
  },
};

export default command;
