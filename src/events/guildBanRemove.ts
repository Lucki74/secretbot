import { GuildBan, EmbedBuilder, AuditLogEvent } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";
import { Colors } from "../utils/Colors.js";

export default async function (client: SecretbotClient, ban: GuildBan) {
  const guild = ban.guild;
  const user = ban.user;

  const auditLog = await guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
      limit: 1,
    })
    .catch(() => null);

  const entry = auditLog?.entries.first();
  const executor = entry?.executor;

  const embed = new EmbedBuilder()
    .setTitle("Member Unbanned")
    .setDescription(
      `**User:** ${user.username} (${user.id})\n**Moderator:** ${executor ? executor.username : "Unknown"}`,
    )
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setTimestamp()
    .setColor(Colors.SUCCESS)
    .setFooter({ text: `User ID: ${user.id}` });

  await LogManager.log(client, guild.id, "unban", embed);
}
