import { GuildMember, EmbedBuilder, AuditLogEvent } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";

export default async (client: SecretbotClient, member: GuildMember) => {
  const auditLog = await member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberKick,
      limit: 1,
    })
    .catch(() => null);

  const entry = auditLog?.entries.first();
  const isKick =
    entry &&
    entry.target?.id === member.id &&
    Date.now() - entry.createdTimestamp < 5000;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL(),
    })
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (isKick) {
    embed
      .setTitle("Member Kicked")
      .setDescription(
        `**User:** ${member.user.username} (${member.id})\n**Moderator:** ${entry.executor?.username || "Unknown"}\n**Reason:** ${entry.reason || "No reason provided"}`,
      )
      .setColor(Colors.MOD_ACTION);
    await LogManager.log(client, member.guild.id, "member_kick", embed);
  } else {
    embed
      .setTitle("Member Left")
      .setDescription(`${member.user.username} left the server.`)
      .setColor(Colors.MEMBER_LEAVE);
    await LogManager.log(client, member.guild.id, "member_leave", embed);
  }
};
