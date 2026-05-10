import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "softban",
  description: "Bans a user then immediately unbans them to clear messages.",
  usage: "!softban <@user|id> [delete_days] [reason]",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (!args[0]) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const targetId = args[0].replace(/[<@!>]/g, "");
    let deleteDays = parseInt(args[1] || "1");
    let reason = args.slice(2).join(" ") || "No reason provided";

    if (isNaN(deleteDays) || deleteDays < 1 || deleteDays > 7) {
      deleteDays = 1;
      reason = args.slice(1).join(" ") || "No reason provided";
    }

    deleteDays = Math.min(7, Math.max(1, deleteDays));

    const targetUser = await client.users.fetch(targetId).catch(() => null);
    if (!targetUser) return message.reply("User not found.");

    const member = await message.guild.members
      .fetch(targetId)
      .catch(() => null);
    if (member && !member.bannable)
      return message.reply("I cannot ban this user.");

    try {
      await targetUser
        .send(
          `You have been softbanned from **${message.guild.name}**: ${reason}`,
        )
        .catch(() => null);
      await message.guild.members.ban(targetId, {
        reason,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });
      await message.guild.bans.remove(targetId, "Softban: immediate unban");

      const caseData = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: targetId,
        modId: message.author.id,
        type: "softban",
        reason: reason,
      });

      const embed = new EmbedBuilder()
        .setColor(Colors.MOD_ACTION)
        .setDescription(
          `✅ Softbanned **${targetUser.username}** (Case #${caseData.caseNumber})\nReason: ${reason}`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await message.reply("Failed to execute softban.");
    }
  },
};

export default command;
