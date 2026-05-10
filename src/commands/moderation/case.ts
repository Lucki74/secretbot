import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "case",
  description: "Displays details for a specific case.",
  usage: "!case <case_number>",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const firstArg = args[0];
    if (!firstArg) return message.reply(`Usage: ${command.usage}`);

    const caseNum = parseInt(firstArg);
    if (isNaN(caseNum))
      return message.reply("Please provide a valid case number.");

    const caseData = await client.db.case.findFirst({
      where: {
        guildId: message.guildId!,
        caseNumber: caseNum,
        deletedAt: null, 
      },
      include: {
        notes: true,
      },
    });

    if (!caseData) return message.reply("Case not found.");

    const target = await client.users
      .fetch(caseData.userId)
      .catch(() => ({ username: "Unknown User" }));
    const moderator = await client.users
      .fetch(caseData.modId)
      .catch(() => ({ username: "Unknown Mod" }));

    const embed = new EmbedBuilder()
      .setTitle(`Case #${caseData.caseNumber} - ${caseData.type.toUpperCase()}`)
      .addFields(
        {
          name: "User",
          value: `${(target as any).username} (\`${caseData.userId}\`)`,
          inline: true,
        },
        {
          name: "Moderator",
          value: `${(moderator as any).username} (\`${caseData.modId}\`)`,
          inline: true,
        },
        { name: "Reason", value: caseData.reason || "None", inline: false },
        {
          name: "Notes",
          value: caseData.notes.map((n) => n.content).join("\n") || "None",
          inline: false,
        },
        {
          name: "Date",
          value: `<t:${Math.floor(caseData.createdAt.getTime() / 1000)}:F>`,
          inline: false,
        },
      )
      .setColor(Colors.INFO)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
