import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "locateuser",
  description: "Finds where a user is in the server (voice channel and recent text activity).",
  usage: "!locateuser <@user|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (client: SecretbotClient, message: Message, args: string[]) => {
    if (!message.guild) return;

    const target = message.mentions.members?.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("Please provide a valid user.");

    const voiceChannel = target.voice.channel;


    const embed = new EmbedBuilder()
      .setTitle(`Location: ${target.user.username}`)
      .setColor("#5865F2")
      .addFields(
        { name: "Voice Channel", value: voiceChannel ? `<#${voiceChannel.id}>` : "None", inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;

