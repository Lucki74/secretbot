import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { truncate } from "../../utils/EmbedUtils.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "roleinfo",
  description: "Displays information about a role.",
  usage: "!roleinfo <@role|id>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const role =
      message.mentions.roles.first() ||
      (args[0] ? message.guild.roles.cache.get(args[0]) : null);

    if (!role) {
      return message.reply(`Usage: ${command.usage}`);
    }

    const perms = role.permissions
      .toArray()
      .map((p) => p.replace(/([A-Z])/g, " $1").trim())
      .join(", ");
    const truncatedPerms = truncate(perms || "None", 1024);

    const embed = new EmbedBuilder()
      .setTitle(`Role Info: ${role.name}`)
      .addFields(
        { name: "ID", value: `\`${role.id}\``, inline: true },
        { name: "Color", value: `\`${role.hexColor}\``, inline: true },
        { name: "Position", value: `${role.position}`, inline: true },
        {
          name: "Mentionable",
          value: role.mentionable ? "Yes" : "No",
          inline: true,
        },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Members", value: `${role.members.size}`, inline: true },
        { name: "Permissions", value: truncatedPerms },
        {
          name: "Created At",
          value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
      )
      .setColor(role.hexColor === "#000000" ? Colors.INFO : role.hexColor);

    await message.reply({ embeds: [embed] });
  },
};

export default command;
