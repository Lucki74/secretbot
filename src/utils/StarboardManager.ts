import { MessageReaction, User, EmbedBuilder, TextChannel } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";
import { Colors } from "./Colors.js";

export class StarboardManager {
  public static async handleReaction(
    client: SecretbotClient,
    reaction: MessageReaction,
    user: User,
  ) {
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== "⭐") return;

    let message = reaction.message;
    if (message.partial) {
      try {
        message = await message.fetch();
      } catch {
        return;
      }
    }

    if (!message.guild || message.author?.bot) return;

    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    const starboard = config.plugins?.starboard;

    if (!starboard || !starboard.enabled) return;

    const threshold = starboard.threshold || 3;
    const count = reaction.count || 0;

    if (count >= threshold) {
      const starboardChannelId = starboard.channelId;
      if (!starboardChannelId) return;

      const channel = await client.channels
        .fetch(starboardChannelId)
        .catch(() => null);
      if (!(channel instanceof TextChannel)) return;

      const existingEntry = await client.db.starboardEntry.findUnique({
        where: {
          guildId_messageId: {
            guildId: message.guild.id,
            messageId: message.id,
          },
        },
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author!.username,
          iconURL: message.author!.displayAvatarURL(),
        })
        .setDescription(message.content || "*Attachment only*")
        .addFields({
          name: "Source",
          value: `[Jump to message](${message.url})`,
        })
        .setFooter({ text: `Message ID: ${message.id}` })
        .setTimestamp(message.createdAt)
        .setColor(Colors.STARBOARD);

      if (message.attachments.size > 0) {
        embed.setImage(message.attachments.first()!.url);
      }

      if (existingEntry) {
        try {
          const starboardMsg = await channel.messages.fetch(
            existingEntry.starboardMessageId,
          );
          await starboardMsg.edit({
            content: `⭐ **${count}** | <#${message.channelId}>`,
            embeds: [embed],
          });
        } catch {
          await client.db.starboardEntry.delete({
            where: { id: existingEntry.id },
          });

          const sent = await channel.send({
            content: `⭐ **${count}** | <#${message.channelId}>`,
            embeds: [embed],
          });
          await client.db.starboardEntry.create({
            data: {
              guildId: message.guild.id,
              messageId: message.id,
              starboardMessageId: sent.id,
            },
          });
        }
      } else {
        const sent = await channel.send({
          content: `⭐ **${count}** | <#${message.channelId}>`,
          embeds: [embed],
        });
        await client.db.starboardEntry.create({
          data: {
            guildId: message.guild.id,
            messageId: message.id,
            starboardMessageId: sent.id,
          },
        });
      }
    }
  }
}
