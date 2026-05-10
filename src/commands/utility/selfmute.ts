import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { parseDuration } from "../../utils/TimeUtils.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "selfmute",
  description: "Mutes yourself for a specified duration.",
  usage: "!selfmute <duration>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild || !message.member) return;

    const durationStr = args[0];
    if (!durationStr) return message.reply("Usage: !selfmute <duration>");

    const durationMs = parseDuration(durationStr);
    if (!durationMs)
      return message.reply("Invalid duration format. Use s, m, h.");

    if (durationMs > 24 * 60 * 60 * 1000) {
      return message.reply("Self-mute duration cannot exceed 24 hours.");
    }

    const expiresAt = new Date(Date.now() + durationMs);

    try {
      await message.member.timeout(durationMs, "Self-mute");

      client.muteManager.cancelUnmute(message.guild.id, message.author.id);
      await client.db.mute.upsert({
        where: {
          guildId_userId: {
            guildId: message.guild.id,
            userId: message.author.id,
          },
        },
        update: { expiresAt, active: true },
        create: {
          guildId: message.guild.id,
          userId: message.author.id,
          expiresAt,
          active: true,
        },
      });

      const caseData = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: message.author.id,
        modId: message.author.id,
        type: "mute",
        reason: `[Self-mute]: ${durationStr}`,
      });

      await client.muteManager.scheduleUnmute(
        message.guild.id,
        message.author.id,
        expiresAt,
      );

      const embed = new EmbedBuilder()
        .setColor("#43B581")
        .setDescription(
          `🔇 You have muted yourself for ${durationStr} (Case #${caseData.caseNumber})\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await message.reply("Failed to execute self-mute.");
    }
  },
};

export default command;
