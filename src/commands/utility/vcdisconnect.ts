import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "vcdisconnect",
  description: "Disconnects a user from a voice channel.",
  usage: "!vcdisconnect <@user|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (!args[0]) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Please provide a user.")
            .setColor("#FAA61A"),
        ],
      });
    }

    const targetId = args[0].replace(/\D/g, "");

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
      await member.voice.disconnect(`Disconnected by ${message.author.username}`);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `Disconnected **${member.user.username}** from voice.`,
            )
            .setColor("#43B581"),
        ],
      });
    } catch (e) {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("Failed to disconnect user. Check permissions.")
            .setColor("#FAA61A"),
        ],
      });
    }
  },
};

export default command;

