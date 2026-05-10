import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "warnlist",
  description: "Displays all warnings for a user.",
  usage: "!warnlist <@user|id>",
  category: "moderation",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const target =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply(`Usage: ${command.usage}`);

    const cases = await client.db.case.findMany({
      where: {
        guildId: message.guild.id,
        userId: target.id,
        type: "warn",
        deletedAt: null, 
      },
      orderBy: { caseNumber: "desc" },
      take: 20,
    });

    if (cases.length === 0)
      return message.reply(`No warnings found for **${target.username}**.`);

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${target.username}`)
      .setDescription(
        cases
          .map(
            (c: any) =>
              `**Case #${c.caseNumber}** | ${c.reason || "No reason"} | <t:${Math.floor(c.createdAt.getTime() / 1000)}:d>`,
          )
          .join("\n"),
      )
      .setColor(Colors.WARNING);

    await message.reply({ embeds: [embed] });
  },
};

export default command;
