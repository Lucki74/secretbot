import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import { Colors } from "../../utils/Colors.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "mutestatus",
  description: "Checks the mute status of a user.",
  usage: "!mutestatus <@user|id>",
  category: "moderation",
  requiredLevel: 50,
  aliases: ["checkMute"],
  execute: async (client: SecretbotClient, message: Message, args: string[]) => {
    if (!message.guild) return;

    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply(`Usage: ${command.usage}`);

    const member = await message.guild.members.fetch(target.id).catch(() => null);

    const activeMute = await client.db.mute.findFirst({
        where: { guildId: message.guild.id, userId: target.id, active: true }
    });

    const timeoutExpiry = member?.communicationDisabledUntilTimestamp;
    const isTimedOut = timeoutExpiry && timeoutExpiry > Date.now();

    if (!activeMute && !isTimedOut) {
        return message.reply(`**${target.username}** is not currently muted.`);
    }

    const embed = new EmbedBuilder()
        .setTitle(`Mute Status: ${target.username}`)
        .setColor(Colors.INFO)
        .setTimestamp();

    let description = "";
    if (activeMute) {
        const dbExpiry = activeMute.expiresAt ? `<t:${Math.floor(activeMute.expiresAt.getTime()/1000)}:R>` : "Permanent";
        description += `**DB Mute:** Active\n**Expiry:** ${dbExpiry}\n`;
    }
    if (isTimedOut) {
        description += `**Timeout Expiry:** <t:${Math.floor(timeoutExpiry / 1000)}:R>`;
    }

    embed.setDescription(description || "User is muted.");
    await message.reply({ embeds: [embed] });
  },
};

export default command;
