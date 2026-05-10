import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "invite",
  description: "Displays information about a Discord invite.",
  usage: "!invite <invite_code>",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const code = args[0];
    if (!code) return message.reply("Please provide an invite code.");

    try {
      const invite = await client.fetchInvite(code);
      const embed = new EmbedBuilder()
        .setTitle(`Invite Info: ${invite.code}`)
        .addFields(
          {
            name: "Server",
            value: invite.guild?.name || "Unknown",
            inline: true,
          },
          {
            name: "Channel",
            value: invite.channel?.name || "Unknown",
            inline: true,
          },
          {
            name: "Inviter",
            value: invite.inviter?.username || "Unknown",
            inline: true,
          },
          {
            name: "Expires At",
            value: invite.expiresAt
              ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:F>`
              : "Never",
            inline: true,
          },
          { name: "Members", value: `${invite.memberCount}`, inline: true },
        )
        .setColor("#5865F2");

      message.reply({ embeds: [embed] });
    } catch (e) {
      message.reply("Invalid or expired invite code.");
    }
  },
};

export default command;

