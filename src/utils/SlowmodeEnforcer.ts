import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { LogManager } from "./LogManager.js";
import { Colors } from "./Colors.js";

export class SlowmodeEnforcer {
  private static lastMessage: Map<string, number> = new Map();

  public static async checkMessage(
    client: SecretbotClient,
    message: Message,
  ): Promise<boolean> {
    if (!message.guild || message.author.bot) return false;

    const slowmode = await client.db.slowmode.findUnique({
      where: {
        guildId_channelId: {
          guildId: message.guild.id,
          channelId: message.channel.id,
        },
      },
    });

    if (!slowmode) return false;

    if (slowmode.seconds > 21600) {
      const key = `${message.guild.id}_${message.channel.id}_${message.author.id}`;
      const last = this.lastMessage.get(key) || 0;
      const now = Date.now();

      if (now - last < slowmode.seconds * 1000) {
        if (message.deletable) {
          await message.delete().catch(() => null);
        }

        const logEmbed = new EmbedBuilder()
          .setTitle("Slowmode Message Deleted")
          .setDescription(
            `**User:** ${message.author.username} (${message.author.id})\n**Channel:** <#${message.channelId}>\n**Slowmode:** ${slowmode.seconds}s`,
          )
          .setColor(Colors.MSG_DELETE)
          .setTimestamp();

        await LogManager.log(
          client,
          message.guild.id,
          "slowmode_delete",
          logEmbed,
        );

        await message.author
          .send(
            `You are sending messages too quickly in <#${message.channel.id}>. Slowmode is set to ${slowmode.seconds} seconds.`,
          )
          .catch(() => null);
        return true;
      }

      this.lastMessage.set(key, now);
    }

    return false;
  }

  public static async cleanup(client: SecretbotClient) {
    const now = new Date();
    await client.db.slowmode.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
  }
}
