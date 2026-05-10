import { GuildMember, EmbedBuilder, AuditLogEvent } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";

export default async (
  client: SecretbotClient,
  oldMember: GuildMember,
  newMember: GuildMember,
) => {
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  if (oldRoles.size !== newRoles.size) {
    const added = newRoles.filter((r) => !oldRoles.has(r.id));
    const removed = oldRoles.filter((r) => !newRoles.has(r.id));

    if (added.size > 0 || removed.size > 0) {
      const embed = new EmbedBuilder()
        .setTitle("Role Update")
        .setAuthor({
          name: newMember.user.username,
          iconURL: newMember.user.displayAvatarURL(),
        })
        .setFooter({ text: `User ID: ${newMember.id}` })
        .setTimestamp()
        .setColor(Colors.VOICE); 

      if (added.size > 0) {
        embed.addFields({
          name: "Role Added",
          value: added.map((r) => `${r}`).join(", "),
        });
      }
      if (removed.size > 0) {
        embed.addFields({
          name: "Role Removed",
          value: removed.map((r) => `${r}`).join(", "),
        });
      }

      await LogManager.log(client, newMember.guild.id, "member_update", embed);
    }
  }

  if (oldMember.nickname !== newMember.nickname) {
    await client.db.nameHistory.create({
      data: {
        userId: newMember.id,
        username: newMember.user.username,
        nickname: newMember.nickname,
        guildId: newMember.guild.id,
        recordedAt: new Date(),
      },
    });

    const embed = new EmbedBuilder()
      .setTitle("Nickname Change")
      .setAuthor({
        name: newMember.user.username,
        iconURL: newMember.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: "Before",
          value: oldMember.nickname || oldMember.user.username,
          inline: true,
        },
        {
          name: "After",
          value: newMember.nickname || newMember.user.username,
          inline: true,
        },
      )
      .setFooter({ text: `User ID: ${newMember.id}` })
      .setTimestamp()
      .setColor(Colors.INFO);

    await LogManager.log(client, newMember.guild.id, "member_update", embed);
  }
};
