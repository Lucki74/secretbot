import {
  Message,
  TextChannel,
  AttachmentBuilder,
  EmbedBuilder,
} from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "archive",
  description:
    "Archives messages from a channel and sends them as a text file.",
  usage: "!archive <#channel|id> [limit]",
  category: "utility",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const channelMention =
      message.mentions.channels.first() ||
      (args[0] ? message.guild.channels.cache.get(args[0]) : message.channel);
    if (!channelMention || !channelMention.isTextBased())
      return message.reply("Invalid text channel.");

    const limit = Math.min(1000, parseInt(args[1] || "100"));
    if (isNaN(limit) || limit <= 0)
      return message.reply("Please provide a valid limit (max 1000).");

    const channel = channelMention as TextChannel;

    try {
      const fetched = await channel.messages.fetch({ limit });
      const log = fetched
        .map(
          (m) =>
            `[${m.createdAt.toISOString()}] ${m.author.username} (${m.author.id}): ${m.content}`,
        )
        .reverse()
        .join("\n");

      const buffer = Buffer.from(log, "utf-8");
      const attachment = new AttachmentBuilder(buffer, {
        name: `archive-${channel.name}-${Date.now()}.txt`,
      });

      const embed = new EmbedBuilder()
        .setTitle("Channel Archive")
        .setDescription(
          `Successfully archived **${fetched.size}** messages from <#${channel.id}>.`,
        )
        .setColor("#43B581");

      await message.reply({ embeds: [embed], files: [attachment] });
    } catch (e) {
      message.reply("Failed to archive channel. Check permissions.");
    }
  },
};

export default command;

