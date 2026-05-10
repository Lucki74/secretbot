import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "vcmove",
  description: "Moves a user to another voice channel.",
  usage: "!vcmove <@user|id> <channel_id>",
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
            .setDescription("Usage: !vcmove <user> <channel>")
            .setColor("#FAA61A"),
        ],
      });
    }

    const targetId = args[0]!.replace(/\D/g, "");
    const channelId = args[1]!.replace(/\D/g, "");

    const member = await message.guild.members
      .fetch(targetId)
      .catch(() => null);
    if (!member) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Member not found.")
            .setColor("#FAA61A"),
        ],
      });
    }

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased()) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Invalid voice channel.")
            .setColor("#FAA61A"),
        ],
      });
    }

    if (!member.voice.channel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("User is not in a voice channel.")
            .setColor("#FAA61A"),
        ],
      });
    }

    try {
      await member.voice.setChannel(channel, `Moved by ${message.author.username}`);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Moved **${member.user.username}** to **${channel.name}**.`,
            )
            .setColor("#43B581"),
        ],
      });
    } catch (e) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Failed to move user. Check permissions.")
            .setColor("#FAA61A"),
        ],
      });
    }
  },
};

export default command;

