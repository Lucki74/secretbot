import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "cases",
  description: "Lists cases for a user.",
  usage: "!cases <@user|id>",
  category: "moderation",
  requiredLevel: 50,
  aliases: ["modlogs", "infractions"],
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
        deletedAt: null,
      },
      orderBy: {
        caseNumber: "desc",
      },
    });

    if (cases.length === 0) {
      await message.reply(`No cases found for **${target.username}**.`);
      return;
    }

    const itemsPerPage = 10;
    const pages = Math.ceil(cases.length / itemsPerPage);
    let currentPage = 1;

    const generateEmbed = (page: number) => {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const currentCases = cases.slice(start, end);

      const description = currentCases
        .map((c) => {
          const dateStr = `<t:${Math.floor(c.createdAt.getTime() / 1000)}:d>`;
          return `[#${c.caseNumber}] **${c.type.toUpperCase()}** — ${c.reason || "No reason"} — ${dateStr}`;
        })
        .join("\n");

      return new EmbedBuilder()
        .setColor(Colors.INFO)
        .setTitle(`Cases for ${target.username} (Page ${page}/${pages})`)
        .setDescription(description)
        .setTimestamp();
    };

    const embedMessage = await message.reply({
      embeds: [generateEmbed(currentPage)],
    });

    if (pages > 1) {
      await embedMessage.react("⬅️");
      await embedMessage.react("➡️");

      const filter = (reaction: any, user: any) => {
        return (
          ["⬅️", "➡️"].includes(reaction.emoji.name) &&
          user.id === message.author.id
        );
      };

      const collector = embedMessage.createReactionCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (reaction, user) => {
        await reaction.users.remove(user.id).catch(() => null);

        if (reaction.emoji.name === "⬅️") {
          if (currentPage > 1) {
            currentPage--;
            await embedMessage.edit({ embeds: [generateEmbed(currentPage)] });
          }
        } else if (reaction.emoji.name === "➡️") {
          if (currentPage < pages) {
            currentPage++;
            await embedMessage.edit({ embeds: [generateEmbed(currentPage)] });
          }
        }
      });

      collector.on("end", () => {
        embedMessage.reactions.removeAll().catch(() => null);
      });
    }
  },
};

export default command;
