import { GuildMember, TextChannel } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";

export class WelcomeManager {
  public static async sendWelcome(client: SecretbotClient, member: GuildMember) {
    const config = await ConfigManager.getGuildConfig(client, member.guild.id);
    if (!config.welcome || !config.welcome.enabled) return;

    const { channelId, message, dm } = config.welcome;
    if (!message) return;

    const formattedMessage = message
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{server}/g, member.guild.name)
      .replace(/{count}/g, member.guild.memberCount.toString());

    if (dm) {
      await member.send(formattedMessage).catch(() => null);
    } else if (channelId) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel instanceof TextChannel) {
        await channel.send(formattedMessage).catch(() => null);
      }
    }
  }
}
