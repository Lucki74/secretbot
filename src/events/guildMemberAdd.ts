import { GuildMember, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";

export default async (client: SecretbotClient, member: GuildMember) => {
  const accountAgeDays = Math.floor(
    (Date.now() - member.user.createdTimestamp) / 86400000,
  );
  const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setTitle("Member Joined")
    .setAuthor({
      name: member.user.username, 
      iconURL: member.user.displayAvatarURL(),
    })
    .setDescription(`${member.user} joined the server.`)
    .addFields({
      name: "Account Created",
      value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
      inline: true,
    })
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp()
    .setColor("#2ECC71");

  if (accountAgeDays < 7) {
    embed.addFields({
      name: "⚠️ New Account",
      value: "Account is less than 7 days old!",
    });
  }

  await LogManager.log(client, member.guild.id, "member_join", embed);

  const persistedRoles = await client.db.persistRole.findMany({
    where: { guildId: member.guild.id, userId: member.id },
  });
  for (const pr of persistedRoles) {
    await member.roles.add(pr.roleId).catch(() => null);
  }

  const { WelcomeManager } = await import("../utils/WelcomeManager.js");
  await WelcomeManager.sendWelcome(client, member);
};

