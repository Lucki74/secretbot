import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "forceban",
  description: "Bans a user who is not in the server by their ID.",
  usage: "!forceban <user_id> [reason]",
  category: "moderation",
  requiredLevel: 75,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const targetId = args[0];
    if (!targetId || !/^\d{17,19}$/.test(targetId)) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild.bans.create(targetId, {
        reason,
        deleteMessageSeconds: 0,
      });

      const caseData = await CaseManager.createCase(client, {
        guildId: message.guild.id,
        userId: targetId,
        modId: message.author.id,
        type: "ban",
        reason: `[Forceban]: ${reason}`,
      });

      const user = await client.users
        .fetch(targetId)
        .catch(() => ({ username: "Unknown User" }));

      const embed = new EmbedBuilder()
        .setColor(Colors.MOD_ACTION)
        .setDescription(
          `✅ Force-banned **${(user as any).username}** (\`${targetId}\`) (Case #${caseData.caseNumber})\nReason: ${reason}`,
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (e) {
      console.error(e);
      await message.reply(
        "Failed to force-ban. Make sure the ID is correct and I have permissions.",
      );
    }
  },
};

export default command;
