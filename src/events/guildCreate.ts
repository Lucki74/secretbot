import { Guild } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export default async (client: SecretbotClient, guild: Guild) => {
  const blacklisted = await client.db.blacklistedGuild.findUnique({
    where: { id: guild.id },
  });

  if (blacklisted) {
    console.log(`Left blacklisted guild: ${guild.name} (${guild.id})`);
    await guild.leave();
    return;
  }

  await client.db.guild.upsert({
    where: { id: guild.id },
    update: {},
    create: { id: guild.id },
  });

  console.log(`Joined guild: ${guild.name} (${guild.id})`);
};
