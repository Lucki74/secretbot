import { ActivityType } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export default async (client: SecretbotClient) => {
  console.log(`Logged in as ${client.user?.username}!`);

  if (client.reminderScheduler?.loadPending) {
    await client.reminderScheduler.loadPending();
  }

  if (client.muteManager?.loadPending) {
    await client.muteManager.loadPending();
  }

  if (client.tempBanManager?.loadPending) {
    await client.tempBanManager.loadPending();
  }

  client.user?.setActivity("!help | secretbot", {
    type: ActivityType.Watching,
  });

  console.log(`Guilds: ${client.guilds.cache.size}`);
  console.log(`Commands: ${client.commands.size}`);

  // Check for blacklisted guilds on startup
  for (const guild of client.guilds.cache.values()) {
    const blacklisted = await client.db.blacklistedGuild.findUnique({
      where: { id: guild.id },
    });

    if (blacklisted) {
      console.log(`Leaving blacklisted guild: ${guild.name} (${guild.id})`);
      await guild.leave().catch(() => null);
    }
  }
};
