import { Message, EmbedBuilder, PermissionsBitField } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { LogManager } from "../../utils/LogManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "kick",
  description: "Kicks a user from the server.",
  usage: "!kick <@user|id> [reason]",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild || !message.member) return;

    if (!args[0]) {
      await message.reply(`Usage: ${command.usage}`);
      return;
    }

    const targetId = args[0].replace(/[<@!>]/g, "");
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (
      !message.guild.members.me?.permissions.has(
        PermissionsBitField.Flags.KickMembers,
      )
    ) {
      await message.reply("I do not have permission to kick members.");
      return;
    }

    const targetMember = await message.guild.members
      .fetch(targetId)
      .catch(() => null);
    if (!targetMember) {
      await message.reply("User not found in the server.");
      return;
    }

    if (!targetMember.kickable) {
      await message.reply("I cannot kick this user.");
      return;
    }

    try {
      await targetMember
        .send(`You have been kicked from **${message.guild.name}**: ${reason}`)
        .catch(() => null);
    } catch {
    }

    await message.guild.members.kick(targetMember, reason);

    const caseData = await CaseManager.createCase(client, {
      guildId: message.guild.id,
      userId: targetId,
      modId: message.author.id,
      type: "kick",
      reason: reason,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.MOD_ACTION)
      .setDescription(
        `✅ Kicked **${targetMember.user.username}** (Case #${caseData.caseNumber})\nReason: ${reason}`,
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await LogManager.log(client, message.guild.id, "mod_action", embed);
  },
};

export default command;
