import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../../SecretbotClient.js";
import type { BotCommand } from "../../types/BotCommand.js";

const command: BotCommand = {
  name: "user",
  description: "Displays information about a user.",
  usage: "!user [@user|id]",
  category: "utility",
  requiredLevel: 0,
  execute: async (
    client: SecretbotClient,
    message: Message,
    args: string[],
  ) => {
    const target =
      message.mentions.users.first() ||
      (args[0]
        ? await client.users.fetch(args[0]).catch(() => null)
        : message.author);

    if (!target) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription("User not found.")
            .setColor("#FAA61A"),
        ],
      });
    }

    const member = message.guild?.members.cache.get(target.id);
    const caseCount = await client.db.case.count({
      where: { guildId: message.guildId!, userId: target.id, deletedAt: null },
    });
    const activeMute = await client.db.mute.findFirst({
      where: { guildId: message.guildId!, userId: target.id, active: true },
    });

    let timeoutInfo = "None";
    if (member && member.communicationDisabledUntilTimestamp) {
      if (member.communicationDisabledUntilTimestamp > Date.now()) {
        timeoutInfo = `Until <t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:F>`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`User Info: ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "ID", value: target.id, inline: true },
        {
          name: "Created At",
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`,
          inline: true,
        },
        {
          name: "Joined At",
          value: member?.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : "Not in server",
          inline: true,
        },
        { name: "Total Cases", value: `${caseCount}`, inline: true },
        {
          name: "Currently Muted (DB)",
          value: activeMute ? "Yes" : "No",
          inline: true,
        },
        { name: "Active Timeout (Discord)", value: timeoutInfo, inline: true },
        {
          name: "Roles",
          value:
            member?.roles.cache
              .filter((r) => r.name !== "@everyone")
              .map((r) => r.name)
              .join(", ") || "None",
          inline: false,
        },
      )
      .setColor("#5865F2")
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;

