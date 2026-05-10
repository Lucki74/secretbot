import {
  Message,
  EmbedBuilder,
  VoiceChannel,
  TextChannel,
  StageChannel,
} from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "channel",
  description: "Displays information about a channel.",
  usage: "!channel [#channel|id]",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    let targetId = message.channel.id;
    if (args[0]) {
      targetId = args[0].replace(/\D/g, "");
    }

    const channel = message.guild.channels.cache.get(targetId) as
      | TextChannel
      | VoiceChannel
      | StageChannel;
    if (!channel) {
      return message.reply("Channel not found.");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Channel Info: ${channel.name}`)
      .setColor("#5865F2")
      .addFields(
        { name: "ID", value: channel.id, inline: true },
        { name: "Type", value: channel.type.toString(), inline: true },
        {
          name: "Position",
          value: channel.position ? channel.position.toString() : "N/A",
          inline: true,
        },
        {
          name: "Created At",
          value: channel.createdTimestamp
            ? `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`
            : "Unknown",
          inline: true,
        },
      );

    if (channel instanceof TextChannel) {
      embed.addFields(
        { name: "NSFW", value: channel.nsfw ? "Yes" : "No", inline: true },
        {
          name: "Slowmode",
          value: `${channel.rateLimitPerUser}s`,
          inline: true,
        },
      );
      if (channel.topic) {
        embed.addFields({ name: "Topic", value: channel.topic, inline: false });
      }
    } else if (
      channel instanceof VoiceChannel ||
      channel instanceof StageChannel
    ) {
      embed.addFields(
        {
          name: "Bitrate",
          value: `${channel.bitrate / 1000}kbps`,
          inline: true,
        },
        {
          name: "User Limit",
          value: channel.userLimit ? channel.userLimit.toString() : "None",
          inline: true,
        },
      );
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;
