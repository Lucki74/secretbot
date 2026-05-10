import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "casenote",
  description: "Adds a note to an existing case.",
  usage: "!casenote <case_number> <note_text>",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const caseNumber = parseInt(args[0] || "");
    const noteText = args.slice(1).join(" ");

    if (isNaN(caseNumber) || !noteText) {
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

    await client.db.caseNote.create({
      data: {
        caseId: caseData.id,
        authorId: message.author.id,
        content: noteText,
      },
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(`✅ Note added to **Case #${caseNumber}**`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
