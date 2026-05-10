import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { CaseManager } from "../../utils/CaseManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "massban",
  description: "Bans multiple users at once.",
  usage: "!massban <id1> <id2> ... [reason]",
  category: "moderation",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    if (args.length === 0) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const ids = args.filter((a) => /^\d{17,19}$/.test(a));
    const reason =
      args.filter((a) => !/^\d{17,19}$/.test(a)).join(" ") || "Massban";

    if (ids.length === 0) {
      return message.reply("Please provide valid User IDs.");
    }

    const uniqueIds = [...new Set(ids)].slice(0, 200);
    const success: string[] = [];
    const failed: string[] = [];

    const statusMsg = await message.reply(
      `Banning ${uniqueIds.length} users...`,
    );

    for (const id of uniqueIds) {
      try {
        await message.guild.members.ban(id, { reason });
        success.push(id);
      } catch (e) {
        failed.push(id);
      }
    }

    const caseData = await CaseManager.createCase(client, {
      guildId: message.guild.id,
      userId: "Multiple",
      modId: message.author.id,
      type: "massban",
      reason: `Massbanned ${success.length} users. Reason: ${reason}`,
      notes: `IDs: ${success.join(", ")}`,
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.MOD_ACTION)
      .setDescription(
        `✅ Massbanned **${success.length} users** (Case #${caseData.caseNumber})\nReason: ${reason}`,
      )
      .setTimestamp();

    if (failed.length > 0) {
      embed.addFields({
        name: "Failed IDs",
        value: failed.join(", ").slice(0, 1024),
      });
    }

    await statusMsg.edit({ content: "", embeds: [embed] });
  },
};

export default command;
