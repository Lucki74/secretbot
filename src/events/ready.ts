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
};

