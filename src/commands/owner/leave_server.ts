import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "leave_server",
  description: "Makes the bot leave a specific server.",
  usage: "!leave_server <guild_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guildId = args[0];
    if (!guildId) return message.reply(`Usage: ${command.usage}`);

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return message.reply("I am not in that server.");

    await guild.leave();
    message.reply(`Left server \`${guild.name}\` (${guildId}).`);
  },
};

export default command;
