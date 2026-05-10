import { Guild } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export default async (client: SecretbotClient, guild: Guild) => {
  console.log(`Left guild: ${guild.name} (${guild.id})`);
  const staffIds = process.env.STAFF_IDS?.split(",") || [];
  for (const ownerId of staffIds) {
    try {
      const owner = await client.users.fetch(ownerId);
      await owner.send(`Bot left guild: ${guild.name} (${guild.id})`);
    } catch (e) {
    }
  }
};
