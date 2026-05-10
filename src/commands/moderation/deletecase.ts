import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "deletecase",
  description: "Deletes a case and all its associated notes.",
  usage: "!deletecase <case_number>",
  category: "moderation",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const caseNumber = parseInt(args[0] || "");

    if (isNaN(caseNumber)) {
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

    await client.db.case.update({
      where: { id: caseData.id },
      data: { deletedAt: new Date() },
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(`✅ Deleted **Case #${caseNumber}**`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
