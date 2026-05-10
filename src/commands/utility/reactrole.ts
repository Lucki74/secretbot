import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "reactrole",
  description: "Manages reaction-based role assignments.",
  usage: "!reactrole <add|remove|list> [args]",
  category: "utility",
  requiredLevel: 100,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subCommand = args[0]?.toLowerCase();
    if (!subCommand) return message.reply(`Usage: ${command.usage}`);

    if (subCommand === "add") {
      const messageId = args[1];
      const emoji = args[2];
      const role =
        message.mentions.roles.first() ||
        (args[3] ? message.guild.roles.cache.get(args[3]) : null);

      if (!messageId || !emoji || !role)
        return message.reply(
          "Usage: !reactrole add <message_id> <emoji> <@role|id>",
        );

      await client.db.reactionRole.upsert({
        where: {
          guildId_messageId_emoji: {
            guildId: message.guild.id,
            messageId,
            emoji,
          },
        },
        update: { roleId: role.id },
        create: {
          guildId: message.guild.id,
          messageId,
          emoji,
          roleId: role.id,
        },
      });

      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Reaction role added! Users reacting with ${emoji} to message \`${messageId}\` will get role **${role.name}**.`,
        )
        .setColor("#43B581");
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === "remove") {
      const messageId = args[1];
      const emoji = args[2];

      if (!messageId || !emoji)
        return message.reply("Usage: !reactrole remove <message_id> <emoji>");

      await client.db.reactionRole.deleteMany({
        where: {
          guildId: message.guild.id,
          messageId,
          emoji,
        },
      });

      const embed = new EmbedBuilder()
        .setDescription(
          `✅ Reaction role removed for ${emoji} on message \`${messageId}\`.`,
        )
        .setColor("#43B581");
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === "list") {
      const rrs = await client.db.reactionRole.findMany({
        where: { guildId: message.guild.id },
      });

      if (rrs.length === 0)
        return message.reply("No reaction roles configured.");

      const embed = new EmbedBuilder()
        .setTitle("Reaction Roles")
        .setDescription(
          rrs
            .map(
              (rr: any) =>
                `Message: \`${rr.messageId}\` | Emoji: ${rr.emoji} | Role: <@&${rr.roleId}>`,
            )
            .join("\n"),
        )
        .setColor("#5865F2");

      return message.reply({ embeds: [embed] });
    }

    message.reply(`Unknown sub-command. Usage: ${command.usage}`);
  },
};

export default command;
