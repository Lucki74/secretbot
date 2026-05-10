import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { LogManager } from "../../utils/LogManager.js";
import { PermissionManager } from "../../utils/PermissionManager.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "role",
  description: "Manages roles in the server.",
  usage: "!role <add|remove|create|delete|info|list> [args]",
  category: "utility",
  requiredLevel: 50,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    if (!message.guild) return;

    const subCommand = args[0]?.toLowerCase();
    if (!subCommand) return message.reply(`Usage: ${command.usage}`);

    const userLevel = await PermissionManager.getLevel(client, message.member!);

    if (
      !message.guild.members.me?.permissions.has(
        PermissionFlagsBits.ManageRoles,
      )
    ) {
      return message.reply("I do not have the **Manage Roles** permission.");
    }

    switch (subCommand) {
      case "add": {
        const targetMember =
          message.mentions.members?.first() ||
          (args[1]
            ? await message.guild.members.fetch(args[1]).catch(() => null)
            : null);
        const role =
          message.mentions.roles.first() ||
          (args[2] ? message.guild.roles.cache.get(args[2]) : null);

        if (!targetMember || !role)
          return message.reply("Usage: !role add <@user|id> <@role|id>");

        try {
          await targetMember.roles.add(role);

          const embed = new EmbedBuilder()
            .setTitle("Role Added")
            .setDescription(
              `**User:** ${targetMember.user.username} (${targetMember.id})\n**Role:** ${role.name} (${role.id})\n**Moderator:** ${message.author.username}`,
            )
            .setColor("#43B581")
            .setTimestamp();

          await message.reply({ embeds: [embed] });
          await LogManager.log(client, message.guild.id, "role_change", embed);
        } catch (e) {
          message.reply("Failed to add role. Check permissions and hierarchy.");
        }
        break;
      }

      case "remove": {
        const targetMember =
          message.mentions.members?.first() ||
          (args[1]
            ? await message.guild.members.fetch(args[1]).catch(() => null)
            : null);
        const role =
          message.mentions.roles.first() ||
          (args[2] ? message.guild.roles.cache.get(args[2]) : null);

        if (!targetMember || !role)
          return message.reply("Usage: !role remove <@user|id> <@role|id>");

        try {
          await targetMember.roles.remove(role);

          const embed = new EmbedBuilder()
            .setTitle("Role Removed")
            .setDescription(
              `**User:** ${targetMember.user.username} (${targetMember.id})\n**Role:** ${role.name} (${role.id})\n**Moderator:** ${message.author.username}`,
            )
            .setColor("#43B581")
            .setTimestamp();

          await message.reply({ embeds: [embed] });
          await LogManager.log(client, message.guild.id, "role_change", embed);
        } catch (e) {
          message.reply(
            "Failed to remove role. Check permissions and hierarchy.",
          );
        }
        break;
      }

      case "create": {
        if (userLevel < 100)
          return message.reply("You need level 100 to create roles.");
        const roleName = args[1];
        const roleColor = args[2];

        if (!roleName)
          return message.reply("Usage: !role create <name> [color]");

        try {
          const newRole = await message.guild.roles.create({
            name: roleName,
            color: (roleColor as any) || undefined,
            reason: `Created by ${message.author.username}`,
          });

          const embed = new EmbedBuilder()
            .setTitle("Role Created")
            .setDescription(
              `**Role:** ${newRole.name} (${newRole.id})\n**Moderator:** ${message.author.username}`,
            )
            .setColor("#43B581")
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        } catch (e) {
          message.reply("Failed to create role.");
        }
        break;
      }

      case "delete": {
        if (userLevel < 100)
          return message.reply("You need level 100 to delete roles.");
        const role =
          message.mentions.roles.first() ||
          (args[1] ? message.guild.roles.cache.get(args[1]) : null);

        if (!role) return message.reply("Usage: !role delete <@role|id>");

        try {
          const roleName = role.name;
          const roleId = role.id;
          await role.delete(`Deleted by ${message.author.username}`);

          const embed = new EmbedBuilder()
            .setTitle("Role Deleted")
            .setDescription(
              `**Role:** ${roleName} (${roleId})\n**Moderator:** ${message.author.username}`,
            )
            .setColor("#43B581")
            .setTimestamp();

          await message.reply({ embeds: [embed] });
        } catch (e) {
          message.reply("Failed to delete role.");
        }
        break;
      }

      case "info": {
        const role =
          message.mentions.roles.first() ||
          (args[1] ? message.guild.roles.cache.get(args[1]) : null);
        if (!role) return message.reply("Usage: !role info <@role|id>");

        const cmd = client.commands.get("roleinfo");
        if (cmd) await cmd.execute(client, message, [role.id]);
        break;
      }

      case "list": {
        const cmd = client.commands.get("roles");
        if (cmd) await cmd.execute(client, message, []);
        break;
      }

      default:
        message.reply(`Unknown sub-command. Usage: ${command.usage}`);
    }
  },
};

export default command;

