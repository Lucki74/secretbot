import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "deletenote",
  description: "Deletes a note from an existing case.",
  usage: "!deletenote <case_number> <note_index>",
  category: "moderation",
  requiredLevel: 75,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const caseNumber = parseInt(args[0] || "");
    const noteIndex = parseInt(args[1] || ""); 

    if (isNaN(caseNumber) || isNaN(noteIndex)) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const caseData = await client.db.case.findFirst({
      where: {
        guildId: message.guild.id,
        caseNumber: caseNumber,
        deletedAt: null, 
      },
      include: {
        notes: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!caseData) {
      return message.reply(`Case #${caseNumber} not found.`);
    }

    const noteToDelete = caseData.notes[noteIndex - 1];

    if (!noteToDelete) {
      return message.reply(
        `Note #${noteIndex} not found in case #${caseNumber}.`,
      );
    }

    await client.db.caseNote.delete({
      where: { id: noteToDelete.id },
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setDescription(
        `✅ Deleted note #${noteIndex} from **Case #${caseNumber}**`,
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
