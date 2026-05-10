import { Guild } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export default async (client: SecretbotClient, guild: Guild) => {
  const allowed = await client.db.allowedGuild.findUnique({
    where: { id: guild.id },
  });

  if (!allowed) {
    console.log(`Left unauthorized guild: ${guild.name} (${guild.id})`);
    await guild.leave();
    return;
  }

  await client.db.guild.upsert({
    where: { id: guild.id },
    update: {},
    create: { id: guild.id },
  });

  console.log(`Joined authorized guild: ${guild.name} (${guild.id})`);
};
