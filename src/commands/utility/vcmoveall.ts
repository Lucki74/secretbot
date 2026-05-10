import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "vcmoveall",
  description: "Moves all users from one voice channel to another.",
  usage: "!vcmoveall <from_channel_id> <to_channel_id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (args.length < 2) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Usage: !vcmoveall <from channel> <to channel>")
            .setColor("#FAA61A"),
        ],
      });
    }

    const fromChannelId = args[0]!.replace(/\D/g, "");
    const toChannelId = args[1]!.replace(/\D/g, "");

    const fromChannel = message.guild.channels.cache.get(fromChannelId);
    const toChannel = message.guild.channels.cache.get(toChannelId);

    if (!fromChannel || !fromChannel.isVoiceBased()) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Invalid 'from' voice channel.")
            .setColor("#FAA61A"),
        ],
      });
    }
    if (!toChannel || !toChannel.isVoiceBased()) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Invalid 'to' voice channel.")
            .setColor("#FAA61A"),
        ],
      });
    }

    const members = fromChannel.members;
    if (members.size === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("No users in the source channel.")
            .setColor("#FAA61A"),
        ],
      });
    }

    let movedCount = 0;
    for (const [, member] of members) {
      try {
        await member.voice.setChannel(
          toChannel,
          `Moved all by ${message.author.username}`,
        );
        movedCount++;
      } catch (e) {}
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(
            `Successfully moved ${movedCount}/${members.size} users to **${toChannel.name}**.`,
          )
          .setColor("#43B581"),
      ],
    });
  },
};

export default command;

