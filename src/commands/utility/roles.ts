import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "roles",
  description: "Lists all roles in the server.",
  usage: "!roles [page]",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const roles = Array.from(message.guild.roles.cache.values()).sort(
      (a, b) => b.position - a.position,
    );

    const embed = new EmbedBuilder()
      .setTitle(`Roles in ${message.guild.name} (${roles.length})`)
      .setColor("#5865F2");

    const pageSize = 20;
    let page = 1;
    if (args[0] && !isNaN(parseInt(args[0]))) {
      page = parseInt(args[0]);
    }
    const maxPages = Math.ceil(roles.length / pageSize);
    if (page < 1) page = 1;
    if (page > maxPages) page = maxPages;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const currentRoles = roles.slice(start, end);

    const desc = currentRoles
      .map((r) => {
        return `${r} | \`${r.id}\` | Members: ${r.members.size} | Color: ${r.hexColor}`;
      })
      .join("\n");

    embed
      .setDescription(desc || "No roles found.")
      .setFooter({ text: `Page ${page}/${maxPages}` });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
