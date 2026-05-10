import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { ConfigManager } from "../../utils/ConfigManager.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "selfgrant",
  description: "Allows users to self-assign or remove specific roles.",
  usage: "!selfgrant <role_name> | !iam <role_name> | !iamnot <role_name>",
  category: "utility",
  requiredLevel: 0,
  aliases: ["iam", "iamnot"],
  execute: async (client: SecretbotClient, message: Message, args: string[]) => {
    if (!message.guild || !message.member) return;

    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    const grantableRoles = config.selfGrantableRoles || [];

    if (grantableRoles.length === 0) {
        return message.reply("No self-grantable roles have been configured for this server.");
    }

    const roleName = args.join(" ").toLowerCase();

    if (!roleName) {
        const embed = new EmbedBuilder()
            .setTitle("Self-Grantable Roles")
            .setDescription(grantableRoles.map(r => `• ${r.name}`).join("\n") || "None")
            .setColor(Colors.INFO)
            .setFooter({ text: "Use !iam <name> to add or !iamnot <name> to remove." });
        return message.reply({ embeds: [embed] });
    }

    const roleConfig = grantableRoles.find(r => r.name.toLowerCase() === roleName);
    if (!roleConfig) {
        return message.reply("That role is not self-grantable.");
    }

    const role = message.guild.roles.cache.get(roleConfig.roleId);
    if (!role) return message.reply("The configured role no longer exists.");

    const isIamNot = message.content.toLowerCase().startsWith(`${config.prefix || "!"}iamnot`);

    try {
        if (isIamNot) {
            if (!message.member.roles.cache.has(role.id)) {
                return message.reply(`You don't have the **${role.name}** role.`);
            }
            await message.member.roles.remove(role);
            await message.reply(`✅ Removed the **${role.name}** role.`);
        } else {
            if (message.member.roles.cache.has(role.id)) {
                return message.reply(`You already have the **${role.name}** role.`);
            }
            await message.member.roles.add(role);
            await message.reply(`✅ Granted you the **${role.name}** role.`);
        }
    } catch (e) {
        message.reply("Failed to update your roles. Check my permissions.");
    }
  },
};

export default command;
