import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { PermissionManager } from "../../utils/PermissionManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "reason",
  description: "Updates the reason for an existing case.",
  usage: "!reason <case_number> <new_reason>",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const caseNumber = parseInt(args[0] || "");
    const newReason = args.slice(1).join(" ");

    if (isNaN(caseNumber) || !newReason) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const caseData = await client.db.case.findFirst({
      where: {
        guildId: message.guild.id,
        caseNumber: caseNumber,
        deletedAt: null, 
      },
    });

    if (!caseData) {
      return message.reply(`Case #${caseNumber} not found.`);
    }

    const userLevel = await PermissionManager.getLevel(client, message.member!);
    if (caseData.modId !== message.author.id && userLevel < 100) {
      return message.reply(
        "You can only update the reason for your own cases unless you are an administrator.",
      );
    }

    await client.db.case.update({
      where: { id: caseData.id },
      data: { reason: newReason },
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(`✅ Reason updated for **Case #${caseNumber}**`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
