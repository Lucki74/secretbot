import { Message, MessageReaction, User, GuildMember } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";

export class ReactionRoleManager {
  public static async handleReactionAdd(client: SecretbotClient, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => null);
    if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

    const guild = reaction.message.guild;
    if (!guild) return;

    const emoji = reaction.emoji.id || reaction.emoji.name;
    if (!emoji) return;

    const rr = await client.db.reactionRole.findUnique({
      where: {
        guildId_messageId_emoji: {
          guildId: guild.id,
          messageId: reaction.message.id,
          emoji: emoji,
        },
      },
    });

    if (rr) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) {
        await member.roles.add(rr.roleId).catch(() => null);
      }
    }
  }

  public static async handleReactionRemove(client: SecretbotClient, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => null);
    if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

    const guild = reaction.message.guild;
    if (!guild) return;

    const emoji = reaction.emoji.id || reaction.emoji.name;
    if (!emoji) return;

    const rr = await client.db.reactionRole.findUnique({
      where: {
        guildId_messageId_emoji: {
          guildId: guild.id,
          messageId: reaction.message.id,
          emoji: emoji,
        },
      },
    });

    if (rr) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) {
        await member.roles.remove(rr.roleId).catch(() => null);
      }
    }
  }
}
