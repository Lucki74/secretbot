import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "unban",
  description: "Unbans a user from the server.",
  usage: "!unban <user_id> [reason]",
  category: "moderation",
  requiredLevel: 75,
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

    try {
      await message.guild.bans.remove(targetId, reason);
      await client.tempBanManager.cancelTempBan(message.guild.id, targetId);
    } catch (err) {
      await message.reply("Failed to unban user. Are they banned?");
      return;
    }

    const caseData = await CaseManager.createCase(client, {
      guildId: message.guild.id,
      userId: targetId,
      modId: message.author.id,
      type: "unban",
      reason: reason,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(
        `✅ Unbanned **${targetId}** (Case #${caseData.caseNumber})\nReason: ${reason}`,
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
