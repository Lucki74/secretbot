import { User, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "../utils/LogManager.js";

export default async (
  client: SecretbotClient,
  oldUser: User,
  newUser: User,
) => {
  if (oldUser.username !== newUser.username) {
    await client.db.nameHistory.create({
      data: {
        userId: newUser.id,
        username: newUser.username,
        recordedAt: new Date(),
      },
    });

    const embed = new EmbedBuilder()
      .setTitle("Username Changed")
      .setDescription(
        `**Old:** ${oldUser.username}\n**New:** ${newUser.username}`,
      )
      .setAuthor({
        name: newUser.username, 
        iconURL: newUser.displayAvatarURL(),
      })
      .setColor("#5865F2")
      .setTimestamp();

    for (const [, guild] of client.guilds.cache) {
      if (guild.members.cache.has(newUser.id)) {
        await LogManager.log(client, guild.id, "username_change", embed);
      }
    }
  }
};

