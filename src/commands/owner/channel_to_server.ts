import { Message } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "channel_to_server",
  description: "Identifies the server a channel belongs to.",
  usage: "!channel_to_server <channel_id>",
  category: "owner",
  requiredLevel: 200,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const channelId = args[0];
    if (!channelId) return message.reply(`Usage: ${command.usage}`);

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !("guild" in channel))
      return message.reply("Channel not found or not in a guild.");

    message.reply(
      `Channel \`${channelId}\` belongs to server: **${channel.guild.name}** (\`${channel.guild.id}\`)`,
    );
  },
};

export default command;
