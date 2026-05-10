import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "rolepersist",
  description: "Manages persistent roles for users.",
  usage: "!rolepersist <add|remove> <@user|id> <@role|id>",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subCommand = args[0]?.toLowerCase();
    const targetMember =
      message.mentions.members?.first() ||
      (args[1]
        ? await message.guild.members.fetch(args[1]).catch(() => null)
        : null);
    const role =
      message.mentions.roles.first() ||
      (args[2] ? message.guild.roles.cache.get(args[2]) : null);

    if (!subCommand || !targetMember || !role)
      return message.reply(`Usage: ${command.usage}`);

    const embed = new EmbedBuilder().setTimestamp();

    if (subCommand === "add") {
      await client.db.persistRole.upsert({
        where: {
          guildId_userId_roleId: {
            guildId: message.guild.id,
            userId: targetMember.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          guildId: message.guild.id,
          userId: targetMember.id,
          roleId: role.id,
        },
      });

      embed
        .setTitle("Role Persistence Added")
        .setDescription(
          `Role **${role.name}** is now persistent for **${targetMember.user.username}**.`,
        )
        .setColor("#43B581");

      await message.reply({ embeds: [embed] });
    } else if (subCommand === "remove") {
      await client.db.persistRole.deleteMany({
        where: {
          guildId: message.guild.id,
          userId: targetMember.id,
          roleId: role.id,
        },
      });

      embed
        .setTitle("Role Persistence Removed")
        .setDescription(
          `Role **${role.name}** is no longer persistent for **${targetMember.user.username}**.`,
        )
        .setColor("#43B581");

      await message.reply({ embeds: [embed] });
    } else {
      message.reply(`Unknown sub-command. Usage: ${command.usage}`);
    }
  },
};

export default command;

