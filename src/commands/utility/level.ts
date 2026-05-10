import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { PermissionManager } from "../../utils/PermissionManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "level",
  description: "Displays the permission level of a user.",
  usage: "!level [user]",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    let targetId = message.author.id;
    if (args[0]) {
      targetId = args[0].replace(/\D/g, "");
    }

    const member = await message.guild.members
      .fetch(targetId)
      .catch(() => null);
    if (!member) {
      return message.reply("Member not found.");
    }

    const level = await PermissionManager.getLevel(client, member);

    const embed = new EmbedBuilder()
      .setTitle(`Permission Level for ${member.user.username}`)
      .setDescription(`Level: **${level}**`)
      .setColor("#5865F2");

    await message.reply({ embeds: [embed] });
  },
};

export default command;
