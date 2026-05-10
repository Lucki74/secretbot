import { Message, EmbedBuilder } from "discord.js";
import { SecretbotClient } from "../SecretbotClient.js";
import { ConfigManager } from "./ConfigManager.js";
import { CaseManager } from "./CaseManager.js";
import { LogManager } from "./LogManager.js";
import { parseDuration } from "./TimeUtils.js";
import { Colors } from "./Colors.js";

export class AutomodManager {
  private static spamCache: Map<string, { count: number; resetAt: number }> =
    new Map();

  private static _cleanup = setInterval(
    () => {
      const now = Date.now();
      AutomodManager.spamCache.forEach((val, key) => {
        if (val.resetAt < now) AutomodManager.spamCache.delete(key);
      });
    },
    10 * 60 * 1000,
  );

  public static async check(
    client: SecretbotClient,
    message: Message,
  ): Promise<boolean> {
    if (!message.guild || !message.member || message.author.bot) return false;

    const config = await ConfigManager.getGuildConfig(client, message.guild.id);
    if (!config.automod || !config.automod.enabled) return false;

    if (config.automod.spam?.count && config.automod.spam?.interval) {
      const { count: maxCount, interval } = config.automod.spam;
      const key = `${message.guild.id}-${message.author.id}`;
      const now = Date.now();

      let cache = this.spamCache.get(key);
      if (!cache || cache.resetAt < now) {
        cache = { count: 0, resetAt: now + interval * 1000 };
      }

      cache.count++;
      this.spamCache.set(key, cache);

      if (cache.count > maxCount) {
        this.spamCache.delete(key);
        await this.executeAction(
          client,
          message,
          "mute 10m",
          "Automod: Spam detected",
        );
        return true;
      }
    }

    if (config.automod?.mentionSpam?.max) {
      const totalMentions =
        message.mentions.users.size + message.mentions.roles.size;
      if (totalMentions >= config.automod.mentionSpam.max) {
        await this.executeAction(
          client,
          message,
          "mute",
          "Mention spam",
          "10m",
        );
        return true;
      }
    }

    if (config.automod?.capsFilter?.percentage && message.content.length > 8) {
      const stripped = message.content.replace(/\s/g, "");
      const upperCount = (stripped.match(/[A-Z]/g) || []).length;
      if (
        stripped.length > 0 &&
        (upperCount / stripped.length) * 100 >
          config.automod.capsFilter.percentage
      ) {
        await this.executeAction(
          client,
          message,
          config.automod.capsFilter.action || "delete",
          "Excessive caps",
          null,
        );
        return true;
      }
    }

    if (config.automod?.antiInvite?.enabled) {
      const inviteRegex =
        /(discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9-]+)/i;
      const match = message.content.match(inviteRegex);
      if (match) {
        const invite = await client.fetchInvite(match[2]!).catch(() => null);
        if (!invite || invite.guild?.id !== message.guild.id) {
          await this.executeAction(
            client,
            message,
            config.automod.antiInvite.action || "delete",
            "External Discord invite",
            null,
          );
          return true;
        }
      }
    }

    if (config.automod.rules && Array.isArray(config.automod.rules)) {
      for (const rule of config.automod.rules) {
        if (!rule || !rule.pattern || !rule.enabled) continue;
        try {
          const regex = new RegExp(rule.pattern, rule.flags || "gi");
          if (regex.test(message.content)) {
            await this.executeAction(
              client,
              message,
              rule.action,
              rule.reason || "Automod: Rule matched",
            );
            return true;
          }
        } catch (e) {
          console.error(
            `Invalid regex in automod config for guild ${message.guild.id}: ${rule.pattern}`,
          );
        }
      }
    }

    return false;
  }

  private static async executeAction(
    client: SecretbotClient,
    message: Message,
    actionStr: string,
    reason: string,
    defaultDuration: string | null = null,
  ) {
    if (!message.guild || !message.member) return;

    const parts = (actionStr || "delete").split(" ");
    const action = parts[0]!.toLowerCase();
    const durationStr = parts[1] || defaultDuration;

    let executed = false;

    try {
      switch (action) {
        case "delete":
          if (message.deletable) {
            await message.delete().catch(() => null);
            executed = true;
          }
          break;
        case "warn":
          await message.author
            .send(
              `You have been warned in **${message.guild.name}** for: ${reason}`,
            )
            .catch(() => null);
          executed = true;
          break;
        case "mute":
          executed = true;
          let expiresAt = null;
          let durationMs = 0;
          if (durationStr) {
            const duration = parseDuration(durationStr);
            if (duration) {
              expiresAt = new Date(Date.now() + duration);
              durationMs = duration;
            }
          }

          if (durationMs > 0 && durationMs <= 2419200000) {
            await message.member.timeout(durationMs, reason).catch(() => null);
          }

          client.muteManager.cancelUnmute(message.guild.id, message.author.id);

          await client.db.mute.upsert({
            where: {
              guildId_userId: {
                guildId: message.guild.id,
                userId: message.author.id,
              },
            },
            update: { expiresAt: expiresAt ?? null, active: true },
            create: {
              guildId: message.guild.id,
              userId: message.author.id,
              expiresAt: expiresAt ?? null,
              active: true,
            },
          });

          if (expiresAt) {
            await client.muteManager.scheduleUnmute(
              message.guild.id,
              message.author.id,
              expiresAt,
            );
          }
          break;
        case "kick":
          if (message.member.kickable) {
            await message.member.kick(reason).catch(() => null);
            executed = true;
          }
          break;
        case "ban":
          if (message.member.bannable) {
            await message.member.ban({ reason }).catch(() => null);
            executed = true;
          }
          break;
      }

      if (executed) {
        await CaseManager.createCase(client, {
          guildId: message.guild.id,
          userId: message.author.id,
          modId: client.user!.id,
          type: action === "delete" ? "note" : action,
          reason: reason,
        });

        const embed = new EmbedBuilder()
          .setTitle(`Automod Action: ${action.toUpperCase()}`)
          .setDescription(
            `**User:** ${message.author.username} (${message.author.id})\n**Reason:** ${reason}`,
          )
          .setColor("#FF6B35")
          .setTimestamp();

        await LogManager.log(client, message.guild.id, "automod", embed);
      }
    } catch (e) {
      console.error(`Error executing automod action ${action}:`, e);
    }
  }
}
