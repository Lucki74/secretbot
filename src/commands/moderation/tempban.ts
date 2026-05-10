import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { parseDuration } from "../../utils/TimeUtils.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "tempban",
  description: "Bans a user for a specified duration.",
  usage: "!tempban <@user|id> <duration> [reason]",
  category: "moderation",
  requiredLevel: 75,
  aliases: ["tban"],
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (!args[0] || !args[1]) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const targetId = args[0].replace(/[<@!>]/g, "");
    const durationStr = args[1];
    const reason = args.slice(2).join(" ") || "No reason provided";

    const durationMs = parseDuration(durationStr);
    if (!durationMs)
      return message.reply(
        "Invalid duration format. Use s, m, h, d, w, mo, y.",
      );

    const expiresAt = new Date(Date.now() + durationMs);

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
          `You have been temporarily banned from **${message.guild.name}** for ${durationStr}: ${reason}`,
        )
        .catch(() => null);
      await message.guild.members.ban(targetId, {
        reason: `[Tempban ${durationStr}]: ${reason}`,
        deleteMessageSeconds: 0,
      });

      await client.db.tempBan.upsert({
        where: {
          guildId_userId: { guildId: message.guild.id, userId: targetId },
        },
        update: { expiresAt, active: true },
        create: {
          guildId: message.guild.id,
          userId: targetId,
          expiresAt,
          active: true,
        },
      });

      const caseData = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: targetId,
        modId: message.author.id,
        type: "ban",
        reason: `[Tempban ${durationStr}]: ${reason}`,
      });

      client.tempBanManager.scheduleUnban(
        message.guild.id,
        targetId,
        expiresAt,
      );

      const embed = new EmbedBuilder()
        .setColor(Colors.MOD_ACTION)
        .setDescription(
          `✅ Temp-banned **${targetUser.username}** (Case #${caseData.caseNumber}) for ${durationStr}\nReason: ${reason}`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await message.reply("Failed to execute temp-ban.");
    }
  },
};

export default command;
