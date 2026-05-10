import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { parseDuration } from "../../utils/TimeUtils.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import { LogManager } from "../../utils/LogManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "mute",
  description: "Mutes a user for a specified duration.",
  usage: "!mute <@user|id> <duration> [reason]",
  category: "moderation",
  requiredLevel: 50,
  aliases: ["tempmute"],
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;
    const target =
      message.mentions.members?.first() ||
      (args[0]
        ? await message.guild.members.fetch(args[0]).catch(() => null)
        : null);
    if (!target)
      return message.reply("Please provide a valid user in the server.");

    const durationStr = args[1];
    if (!durationStr) return message.reply(`Usage: ${command.usage}`);

    const durationMs = parseDuration(durationStr);
    if (!durationMs)
      return message.reply(
        "Invalid duration format. Use s, m, h, d, w, mo, y.",
      );

    const reason = args.slice(2).join(" ") || "No reason provided";
    const expiresAt = new Date(Date.now() + durationMs);

    try {
      if (durationMs <= 2419200000) {
        await target.timeout(durationMs, reason);
      } else {
        const config = await ConfigManager.getGuildConfig(
          client,
          message.guildId!,
        );
        const muteRoleId = config.muteRoleId;
        if (!muteRoleId) {
          return message.reply(
            "Duration > 28 days requires a configured `muteRoleId` in the server config.",
          );
        }
        await target.roles.add(muteRoleId, reason);
      }

      client.muteManager.cancelUnmute(message.guildId!, target.id);
      await client.db.mute.upsert({
        where: {
          guildId_userId: { guildId: message.guild.id, userId: target.id },
        },
        update: { expiresAt, active: true },
        create: {
          guildId: message.guild.id,
          userId: target.id,
          expiresAt,
          active: true,
        },
      });

      const newCase = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: target.id,
        modId: message.author.id,
        type: "mute",
        reason: `${durationStr}: ${reason}`,
      });

      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Muted **${target.user.username}** (Case #${newCase.caseNumber})\nReason: ${durationStr}: ${reason}`,
        )
        .setColor(Colors.MOD_ACTION)
        .setTimestamp();

      message.reply({ embeds: [embed] });

      await client.muteManager.scheduleUnmute(
        message.guild.id,
        target.id,
        expiresAt,
      );

      await LogManager.log(client, message.guild.id, "mod_action", embed);
    } catch (e) {
      console.error(e);
      message.reply(
        "Failed to mute the user. Check my permissions or role hierarchy.",
      );
    }
  },
};

export default command;
