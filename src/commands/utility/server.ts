import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "server",
  description: "Displays information about the server.",
  usage: "!server",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const guild = message.guild;
    if (!guild) return;

    const caseCount = await client.db.case.count({
      where: { guildId: guild.id },
    });

    const embed = new EmbedBuilder()
      .setTitle(`Server Info: ${guild.name}`)
      .setThumbnail(guild.iconURL() || null)
      .addFields(
        { name: "ID", value: guild.id, inline: true },
        {
          name: "Owner",
          value: (await guild.fetchOwner()).user.username,
          inline: true,
        },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        {
          name: "Channels",
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: "Boost Level",
          value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`,
          inline: true,
        },
        {
          name: "Verification Level",
          value: `${guild.verificationLevel}`,
          inline: true,
        },
        { name: "Total Cases", value: `${caseCount}`, inline: true },
        {
          name: "Created At",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: false,
        },
      )
      .setColor("#5865F2");

    message.reply({ embeds: [embed] });
  },
};

export default command;

