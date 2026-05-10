import { EmbedBuilder, TextChannel } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";

export class LogManager {
  public static async log(
    client: SecretbotClient,
    guildId: string,
    eventType: string,
    embed: EmbedBuilder,
  ) {
    if (client.dashboardIo) {
      client.dashboardIo.emit("log", {
        guildId,
        event: eventType.toUpperCase().replace("_", " "),
        content: embed.data.title || "Event triggered",
      });
    }

    const config = await ConfigManager.getGuildConfig(client, guildId);
    const logging = config.plugins?.logging;

    if (!logging || !logging.enabled) return;

    const channelId =
      logging.channels?.[eventType] || logging.channels?.default;
    if (!channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel instanceof TextChannel) {
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
}
