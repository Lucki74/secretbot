import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "context",
  description: "Provides context for a message ID.",
  usage: "!context <messageId> [channelId]",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;
    if (!args[0]) return message.reply("Please provide a message ID.");

    const messageId = args[0];
    let channelId = message.channel.id;

    if (args[1]) {
      channelId = args[1].replace(/\D/g, "");
    }

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      return message.reply("Invalid text channel.");
    }

    try {
      const targetMessage = await (channel as TextChannel).messages.fetch(
        messageId,
      );

      const embed = new EmbedBuilder()
        .setTitle("Message Context")
        .setDescription(`[Jump to Message](${targetMessage.url})`)
        .setColor("#5865F2");

      await message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply("Message not found in the specified channel.");
    }
  },
};

export default command;
